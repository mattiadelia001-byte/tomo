import { useState, type FormEvent } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { addTasks, deleteTask, findTask, updateTask, useStore, type TaskDraft } from "../state/store";
import { DAY_PARTS, DAY_SHORT, dateKey, fmtTime, parseKey, parseTime, weekDates } from "../model/time";
import type { DayPart } from "../model/types";
import { weekOf } from "../model/selectors";
import { Modal, Seg } from "./ui";
import { CategoryPicker } from "./CategoryPicker";

const DURATIONS = [30, 60, 90, 120];

export function TaskDialog() {
  const draft = useStore((s) => s.taskDialog);
  const close = () => useStore.setState({ taskDialog: null });
  return (
    <Modal open={!!draft} onClose={close}>
      {draft && <TaskForm draft={draft} onClose={close} />}
    </Modal>
  );
}

function TaskForm({ draft, onClose }: { draft: TaskDraft; onClose: () => void }) {
  const categories = useStore((s) => s.categories);
  const existing = draft.id ? findTask(draft.id) : undefined;
  const start = existing?.date ?? draft.date ?? dateKey(new Date());
  const week = weekDates(weekOf(parseKey(start)));
  const today = dateKey(new Date());

  const [title, setTitle] = useState(existing?.title ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0].id);
  const [dates, setDates] = useState<string[]>([start]);
  const [when, setWhen] = useState<"day" | "part" | "time">(existing?.time !== undefined ? "time" : existing?.part ? "part" : "day");
  const [time, setTime] = useState(existing?.time ?? 18 * 60);
  const [part, setPart] = useState<DayPart>(existing?.part ?? "morning");
  const [duration, setDuration] = useState<number | undefined>(existing?.duration);
  const [note, setNote] = useState(existing?.note ?? "");

  const toggleDate = (d: string) => {
    if (existing) return setDates([d]);
    setDates(dates.includes(d) ? (dates.length > 1 ? dates.filter((x) => x !== d) : dates) : [...dates, d].sort());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === categoryId);
    const input = {
      title: title.trim() || cat?.name || "Attività",
      categoryId,
      time: when === "time" ? time : undefined,
      part: when === "part" ? part : undefined,
      duration: duration && duration > 0 ? duration : undefined,
      note: note.trim() || undefined,
    };
    if (existing) updateTask(existing.id, { ...input, date: dates[0], status: dates[0] === existing.date ? existing.status : undefined });
    else addTasks(input, dates);
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <div className="dialog-body">
        <input
          className="title-input"
          autoFocus
          placeholder="Cosa devi fare?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          spellCheck={false}
        />

        <CategoryPicker value={categoryId} onChange={setCategoryId} />

        <div className="field">
          <span className="label">{existing ? "Giorno" : "Giorni"}</span>
          <div className="chips">
            {week.map((d, i) => (
              <button type="button" key={d} className={"chip day" + (dates.includes(d) ? " on" : "") + (d < today ? " past" : "")} onClick={() => toggleDate(d)}>
                <span>{DAY_SHORT[i]}</span>
                <b>{parseKey(d).getDate()}</b>
              </button>
            ))}
          </div>
          {!existing && <span className="hint">Puoi sceglierne più di uno: per esempio la palestra lunedì, mercoledì e venerdì.</span>}
        </div>

        <div className="field">
          <div className="field-inline">
            <span className="label">Orario</span>
            <Seg value={when} options={[["day", "In giornata"], ["part", "In un momento"], ["time", "A un orario"]]} onChange={setWhen} />
            {when === "part" && <Seg value={part} options={DAY_PARTS} onChange={setPart} />}
            {when === "time" && (
              <input className="input" type="time" step={300} value={fmtTime(time)} onChange={(e) => e.target.value && setTime(parseTime(e.target.value))} style={{ width: 110, height: 36 }} />
            )}
          </div>
        </div>

        <div className="field">
          <span className="label">Durata <span className="optional">facoltativa, serve per gli obiettivi in ore</span></span>
          <div className="chips">
            <button type="button" className={"chip" + (!duration ? " on" : "")} onClick={() => setDuration(undefined)}>Nessuna</button>
            {DURATIONS.map((d) => (
              <button type="button" key={d} className={"chip" + (duration === d ? " on" : "")} onClick={() => setDuration(d)}>
                {d < 60 ? `${d} min` : `${d / 60} h`.replace(".5", ",5")}
              </button>
            ))}
            <input
              className="input"
              type="number"
              min={5}
              step={5}
              placeholder="min"
              value={duration ?? ""}
              onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : undefined)}
              style={{ width: 76, height: 34 }}
              aria-label="Minuti"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="note">Nota <span className="optional">facoltativa</span></label>
          <textarea id="note" className="input" rows={3} placeholder="Dettagli dell'attività: esercizi, capitoli da fare, cosa portare..." value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>
      <div className="dialog-foot">
        {existing && (
          <button type="button" className="btn danger" onClick={() => { deleteTask(existing.id); onClose(); }}>
            <TrashIcon size={14} weight="bold" /> Elimina
          </button>
        )}
        <span className="grow" />
        <button type="button" className="btn quiet" onClick={onClose}>Annulla</button>
        <button type="submit" className="btn primary">{existing ? "Salva" : dates.length > 1 ? `Aggiungi a ${dates.length} giorni` : "Aggiungi"}</button>
      </div>
    </form>
  );
}
