import { useEffect } from "react";
import { ArrowSquareOutIcon, FireIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { useStore } from "../state/store";
import { fmtWhen, taskState, tasksOn, streak } from "../model/selectors";
import { dateKey, fmtLongDate } from "../model/time";
import type { Task } from "../model/types";
import { CheckButton, tone, useCategory } from "../components/ui";
import { placeWidget, setWidget, showMain } from "../platform";
import { useNow } from "../hooks/useNow";
import { useToggle } from "./TodayView";

/** Today's tasks in a small window that sits on the desktop. */
export function WidgetView() {
  const data = useStore();
  const now = useNow();
  const today = dateKey(now);
  const tasks = tasksOn(data, today);
  const done = tasks.filter((t) => t.status === "done").length;
  const days = streak(data, now);

  useEffect(() => { placeWidget(); }, []);

  return (
    <div className="widget">
      <header className="widget-head" data-tauri-drag-region>
        <div data-tauri-drag-region>
          <b data-tauri-drag-region>Oggi</b>
          <span className="date" data-tauri-drag-region>{fmtLongDate(now)}</span>
        </div>
        <span className="widget-streak c-peach" title="Giorni di fila con almeno un'attività fatta">
          <FireIcon size={16} weight="fill" className={days ? "flame" : undefined} color={days ? "#ff9b62" : "#e2c9b4"} />
          {days}
        </span>
      </header>

      <div className="widget-list">
        {tasks.length
          ? tasks.map((t) => <WidgetTask key={t.id} task={t} today={today} />)
          : <p className="widget-empty">Niente in programma per oggi.</p>}
      </div>

      <footer className="widget-foot">
        <span>{tasks.length ? `${done} di ${tasks.length} fatte` : ""}</span>
        <button className="widget-btn" onClick={() => showMain(true)} title="Nuova attività" aria-label="Nuova attività">
          <PlusIcon size={16} weight="bold" />
        </button>
        <button className="widget-btn" onClick={() => showMain()} title="Apri Tomo" aria-label="Apri Tomo">
          <ArrowSquareOutIcon size={16} weight="bold" />
        </button>
        <button className="widget-btn" onClick={() => setWidget(false)} title="Togli dalla scrivania" aria-label="Togli dalla scrivania">
          <XIcon size={16} weight="bold" />
        </button>
      </footer>
    </div>
  );
}

function WidgetTask({ task, today }: { task: Task; today: string }) {
  const cat = useCategory(task.categoryId);
  const state = taskState(task, today);
  const toggle = useToggle(task);
  return (
    <div className={`widget-task ${state} ${tone(cat)}`}>
      <CheckButton on={state === "done"} onToggle={toggle} label={state === "done" ? "Segna come da fare" : "Segna come fatto"} />
      <span className="t">{task.title}</span>
      {fmtWhen(task) && <small>{fmtWhen(task)}</small>}
    </div>
  );
}
