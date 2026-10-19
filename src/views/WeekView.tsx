import { useState, type DragEvent, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CaretLeftIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { celebrate, moveTask, setStatus, useStore } from "../state/store";
import { fmtWhen, isPlanDay, planWeekOffset, taskState, tasksOn, weekOf, weekTasks } from "../model/selectors";
import { DAY_SHORT, dateKey, fmtDuration, fmtWeekRange, parseKey, weekDates } from "../model/time";
import type { Task } from "../model/types";
import { CheckButton, ease, tone, useCategory } from "../components/ui";
import { useNow } from "../hooks/useNow";

export function WeekView() {
  const data = useStore();
  const offset = useStore((s) => s.weekOffset);
  const now = useNow();
  const [over, setOver] = useState<string | null>(null);

  const monday = weekOf(now, offset);
  const dates = weekDates(monday);
  const today = dateKey(now);
  const all = weekTasks(data, monday);
  const setOffset = (weekOffset: number) => useStore.setState({ weekOffset });

  let sub = fmtWeekRange(monday);
  if (offset === 0) sub += " · questa settimana";
  else if (offset === 1) sub += " · la prossima";
  const planning = isPlanDay(data, now) && offset === planWeekOffset(data.planDay);

  const totals = data.categories
    .map((c) => {
      const list = all.filter((t) => t.categoryId === c.id && t.status !== "skipped");
      return { c, count: list.length, minutes: list.reduce((s, t) => s + (t.duration ?? 0), 0) };
    })
    .filter((t) => t.count);

  const onDrop = (e: DragEvent, date: string) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData("text/plain");
    const task = data.tasks.find((t) => t.id === id);
    if (task && task.date !== date) moveTask(id, date);
  };

  return (
    <div className="page week-page">
      <motion.header className="page-head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div>
          <h1>{planning ? "Il piano della settimana" : "Settimana"}</h1>
          <p className="sub">{sub}</p>
        </div>
        <div className="actions">
          <button className="icon-btn" title="Settimana precedente" onClick={() => setOffset(offset - 1)}><CaretLeftIcon size={16} weight="bold" /></button>
          <button className="btn quiet" disabled={offset === 0} onClick={() => setOffset(0)} style={{ opacity: offset === 0 ? 0.4 : 1 }}>Oggi</button>
          <button className="icon-btn" title="Settimana successiva" onClick={() => setOffset(offset + 1)}><CaretRightIcon size={16} weight="bold" /></button>
          <button className="btn primary" style={{ marginLeft: 8 }} onClick={() => useStore.setState({ taskDialog: { date: dates.includes(today) ? today : dates[0] } })}>
            <PlusIcon size={14} weight="bold" /> Nuova attività
          </button>
        </div>
      </motion.header>

      <div className="week-legend">
        {totals.length ? (
          totals.map(({ c, count, minutes }) => (
            <span key={c.id} className={"tag " + tone(c)}>
              {c.name} <b>{count}{minutes > 0 && ` · ${fmtDuration(minutes)}`}</b>
            </span>
          ))
        ) : (
          <span className="hint">Settimana vuota. Usa il + sotto ogni giorno per aggiungere quello che vuoi fare.</span>
        )}
      </div>

      <motion.div key={offset} className="wk-cols" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }}>
        {dates.map((date, i) => {
          const tasks = tasksOn(data, date);
          const done = tasks.filter((t) => t.status === "done").length;
          return (
            <motion.section
              key={date}
              className={"wk-day" + (date === today ? " today" : "") + (date < today ? " past" : "") + (over === date ? " over" : "")}
              variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } } }}
              onDragOver={(e) => { e.preventDefault(); if (over !== date) setOver(date); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); }}
              onDrop={(e) => onDrop(e, date)}
            >
              <header>
                <span>{DAY_SHORT[i]}</span>
                <b>{parseKey(date).getDate()}</b>
                {tasks.length > 0 && <small>{done}/{tasks.length}</small>}
              </header>
              <div className="wk-list">
                <AnimatePresence initial={false}>
                  {tasks.map((t) => <WeekTask key={t.id} task={t} today={today} />)}
                </AnimatePresence>
              </div>
              <button className="wk-add" onClick={() => useStore.setState({ taskDialog: { date } })} title="Aggiungi">
                <PlusIcon size={14} weight="bold" />
              </button>
            </motion.section>
          );
        })}
      </motion.div>
      <p className="hint" style={{ marginTop: 14 }}>Trascina un'attività su un altro giorno per spostarla. Cliccala per modificarla.</p>
    </div>
  );
}

function WeekTask({ task, today }: { task: Task; today: string }) {
  const cat = useCategory(task.categoryId);
  const state = taskState(task, today);
  const toggle = (e: MouseEvent) => {
    e.stopPropagation();
    if (task.status === "done") return setStatus(task.id, null);
    setStatus(task.id, "done");
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    celebrate(r.left + r.width / 2, r.top + r.height / 2);
  };

  return (
    <motion.div
      layout
      className={`wk-task ${state} ${tone(cat)}`}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.3, ease }}
    >
      <div
        className="wk-task-inner"
        draggable
        onDragStart={(e) => { e.dataTransfer.setData("text/plain", task.id); e.dataTransfer.effectAllowed = "move"; }}
        onClick={() => useStore.setState({ taskDialog: { id: task.id } })}
      >
        <span className="t">{task.title}</span>
        {(fmtWhen(task) || task.duration) && (
          <span className="h">
            {fmtWhen(task)}
            {fmtWhen(task) && task.duration ? " · " : ""}
            {task.duration ? fmtDuration(task.duration) : ""}
          </span>
        )}
      </div>
      <CheckButton on={state === "done"} onToggle={toggle} label={state === "done" ? "Segna come da fare" : "Segna come fatto"} />
    </motion.div>
  );
}
