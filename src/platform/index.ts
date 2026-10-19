// Hides the differences between the Tauri app (Mac/Windows) and the browser
// (used only for development and automated tests).

import { getCurrentWindow } from "@tauri-apps/api/window";

export const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** "main" or "widget". In the browser the widget is opened with `?widget`. */
export const windowLabel: string = isTauri
  ? getCurrentWindow().label
  : new URLSearchParams(location.search).has("widget") ? "widget" : "main";
export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const APP_NAME = "Tomo";

const baseName = (p: string) => p.split(/[\\/]/).pop() ?? p;

async function tauriInvoke<T>(cmd: string, args?: any, opts?: any): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args, opts);
}

export interface PickedFile {
  name: string;
  path: string | null;
  bytes: Uint8Array;
}

export interface FileFilter {
  name: string;
  extensions: string[];
}

export async function readPath(path: string): Promise<PickedFile> {
  const data = await tauriInvoke<ArrayBuffer>("read_file", { path });
  return { name: baseName(path), path, bytes: new Uint8Array(data) };
}

export async function writePath(path: string, bytes: Uint8Array): Promise<void> {
  await tauriInvoke<void>("write_file", bytes, { headers: { path: encodeURIComponent(path) } });
}

export async function fromFile(f: File): Promise<PickedFile> {
  return { name: f.name, path: null, bytes: new Uint8Array(await f.arrayBuffer()) };
}

/** "Open" dialog: returns the chosen files. */
export async function pickFiles(filters: FileFilter[] = [], multiple = true): Promise<PickedFile[]> {
  if (isTauri) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const res = await open({ multiple, filters });
    if (!res) return [];
    const paths = Array.isArray(res) ? res : [res];
    return Promise.all(paths.map(readPath));
  }
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = filters.flatMap((f) => f.extensions.map((e) => "." + e)).join(",");
    input.multiple = multiple;
    input.onchange = async () => resolve(await Promise.all(Array.from(input.files ?? []).map(fromFile)));
    input.click();
  });
}

/** Saves to a user-chosen path. Returns null if cancelled. */
export async function saveAs(bytes: Uint8Array, suggested: string, filters: FileFilter[] = []): Promise<string | null> {
  if (isTauri) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const path = await save({ defaultPath: suggested, filters });
    if (!path) return null;
    await writePath(path, bytes);
    return path;
  }
  download(bytes, suggested, "application/octet-stream");
  return suggested;
}

export function download(bytes: Uint8Array, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function openExternal(url: string): Promise<void> {
  if (isTauri) {
    const { openUrl } = await import("@tauri-apps/plugin-opener");
    await openUrl(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

export async function confirmDialog(message: string, okLabel = "OK", cancelLabel = "Annulla"): Promise<boolean> {
  if (isTauri) {
    const { ask } = await import("@tauri-apps/plugin-dialog");
    return ask(message, { title: APP_NAME, kind: "warning", okLabel, cancelLabel });
  }
  return window.confirm(message);
}

export async function setWindowTitle(title: string) {
  document.title = title;
  if (!isTauri) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().setTitle(title);
}

export async function exitApp() {
  if (isTauri) await tauriInvoke("exit_app");
}

const DATA_KEY = "tomo-data";

/** App data (JSON): a file in the app data folder, localStorage in the browser. */
export async function loadData(): Promise<string | null> {
  if (isTauri) return tauriInvoke<string | null>("load_data");
  return localStorage.getItem(DATA_KEY);
}

export async function saveData(data: string): Promise<void> {
  if (isTauri) await tauriInvoke<void>("save_data", { data });
  else localStorage.setItem(DATA_KEY, data);
}

/** Calls `fn` with the payload of an app event (see `lib.rs`); returns the unsubscribe function. */
export function onAppEvent<T>(name: string, fn: (payload: T) => void): () => void {
  if (!isTauri) return () => {};
  const off = import("@tauri-apps/api/event").then(({ listen }) => listen<T>(name, (e) => fn(e.payload)));
  return () => { off.then((f) => f()); };
}

export async function setWidget(on: boolean) {
  if (isTauri) await tauriInvoke("set_widget", { on });
}

export async function showMain(newTask = false) {
  if (isTauri) await tauriInvoke("show_main", { newTask });
}

const WIDGET_POS_KEY = "tomo-widget-pos";

/** Puts the widget back where it was last left, shows it, then remembers where it gets moved. */
export async function placeWidget() {
  if (!isTauri) return;
  const { PhysicalPosition } = await import("@tauri-apps/api/dpi");
  const w = getCurrentWindow();
  const saved = localStorage.getItem(WIDGET_POS_KEY);
  if (saved) {
    const [x, y] = JSON.parse(saved);
    await w.setPosition(new PhysicalPosition(x, y));
  }
  await w.show();
  await w.onMoved(({ payload }) => localStorage.setItem(WIDGET_POS_KEY, JSON.stringify([payload.x, payload.y])));
}
