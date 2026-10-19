use tauri::{
    ipc::{InvokeBody, Request, Response},
    AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder, WindowEvent,
};

#[tauri::command]
fn read_file(path: String) -> Result<Response, String> {
    std::fs::read(&path)
        .map(Response::new)
        .map_err(|e| format!("Impossibile leggere {path}: {e}"))
}

/// Content arrives as a raw binary body; the path in the percent-encoded `path` header.
#[tauri::command]
fn write_file(request: Request<'_>) -> Result<(), String> {
    let encoded = request
        .headers()
        .get("path")
        .and_then(|v| v.to_str().ok())
        .ok_or("Percorso mancante")?;
    let path = percent_encoding::percent_decode_str(encoded)
        .decode_utf8()
        .map_err(|e| e.to_string())?
        .to_string();
    let InvokeBody::Raw(data) = request.body() else {
        return Err("Dati non validi".into());
    };
    std::fs::write(&path, data).map_err(|e| format!("Impossibile scrivere {path}: {e}"))
}

fn data_file(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("data.json"))
}

#[tauri::command]
fn load_data(app: AppHandle) -> Result<Option<String>, String> {
    let path = data_file(&app)?;
    match std::fs::read_to_string(&path) {
        Ok(s) => Ok(Some(s)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Writes to a temp file and renames it, so a crash mid-write never corrupts the data.
/// Then tells the other windows, which reload it (payload: the label of the window that saved).
#[tauri::command]
fn save_data(app: AppHandle, window: WebviewWindow, data: String) -> Result<(), String> {
    let path = data_file(&app)?;
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, data).map_err(|e| e.to_string())?;
    std::fs::rename(&tmp, &path).map_err(|e| e.to_string())?;
    app.emit("tomo:saved", window.label()).map_err(|e| e.to_string())
}

/// Opens or closes the desktop widget: a small window that stays below the other windows.
/// Async because creating a window from a sync command deadlocks on Windows.
#[tauri::command]
async fn set_widget(app: AppHandle, on: bool) -> Result<(), String> {
    match (app.get_webview_window("widget"), on) {
        (None, true) => {
            WebviewWindowBuilder::new(&app, "widget", WebviewUrl::App("index.html".into()))
                .title("Tomo")
                // as wide as the system widgets on the desktop
                .inner_size(345.0, 382.0)
                .resizable(false)
                .decorations(false)
                .transparent(true)
                .shadow(false)
                .always_on_bottom(true)
                .visible_on_all_workspaces(true)
                .skip_taskbar(true)
                // the widget shows itself once it's back where it was left
                .visible(false)
                .build()
                .map_err(|e| e.to_string())?;
        }
        (Some(w), false) => {
            w.destroy().map_err(|e| e.to_string())?;
            // Tomo was only running for the widget
            if !app.get_webview_window("main").is_some_and(|m| m.is_visible().unwrap_or(true)) {
                app.exit(0);
            }
        }
        _ => {}
    }
    app.emit("tomo:widget", on).map_err(|e| e.to_string())
}

/// "Closing" Tomo while the widget is on the desktop hides the main window and the Dock icon,
/// so the widget stays. Without the widget it quits.
fn close_main(app: &AppHandle) {
    if app.get_webview_window("widget").is_none() {
        return app.exit(0);
    }
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    }
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Accessory);
}

fn show_main_window(app: &AppHandle) {
    #[cfg(target_os = "macos")]
    let _ = app.set_activation_policy(tauri::ActivationPolicy::Regular);
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

/// From the widget: brings the main window up, optionally with the new task dialog open.
#[tauri::command]
fn show_main(app: AppHandle, new_task: bool) -> Result<(), String> {
    show_main_window(&app);
    if new_task {
        app.emit_to("main", "tomo:new-task", ()).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn exit_app(app: AppHandle) {
    app.exit(0);
}

pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        // single window: launching the app again focuses the running instance
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            show_main_window(app);
        }));
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![read_file, write_file, load_data, save_data, set_widget, show_main, exit_app])
        .setup(|app| {
            // ⌘Q can't be stopped once it reaches macOS: swap it for an item that goes through close_main
            #[cfg(target_os = "macos")]
            {
                use tauri::menu::{Menu, MenuItem, MenuItemKind};
                let menu = Menu::default(app.handle())?;
                if let Some(MenuItemKind::Submenu(app_menu)) = menu.items()?.into_iter().next() {
                    if let Some(quit) = app_menu.items()?.last() {
                        app_menu.remove(quit)?;
                    }
                    app_menu.append(&MenuItem::with_id(app, "quit", "Esci da Tomo", true, Some("CmdOrCtrl+Q"))?)?;
                }
                app.set_menu(menu)?;
            }
            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id() == "quit" {
                close_main(app);
            }
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                if window.label() == "main" && window.app_handle().get_webview_window("widget").is_some() {
                    api.prevent_close();
                    close_main(window.app_handle());
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("errore durante l'avvio di Tomo")
        .run(|_app, _event| {
            // clicking the Dock icon brings back the hidden main window
            #[cfg(target_os = "macos")]
            if let tauri::RunEvent::Reopen { .. } = _event {
                show_main_window(_app);
            }
        });
}
