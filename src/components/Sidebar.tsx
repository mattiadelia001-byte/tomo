import { motion } from "motion/react";
import { CalendarBlankIcon, FireIcon, SquaresFourIcon, SunIcon, TargetIcon } from "@phosphor-icons/react";
import { setName, setPlanDay, setView, useStore, type View } from "../state/store";
import { streak } from "../model/selectors";
import { isMac, isTauri } from "../platform";
import { spring } from "./ui";
import { useNow } from "../hooks/useNow";
import { useWidget } from "../hooks/useWidget";
import { DAY_LONG } from "../model/time";

const ITEMS: { id: View; label: string; Icon: typeof SunIcon; tone: string }[] = [
  { id: "today", label: "Oggi", Icon: SunIcon, tone: "c-butter" },
  { id: "week", label: "Settimana", Icon: CalendarBlankIcon, tone: "c-sky" },
  { id: "goals", label: "Obiettivi", Icon: TargetIcon, tone: "c-mint" },
];

export function Sidebar() {
  const view = useStore((s) => s.view);
  const name = useStore((s) => s.name);
  const planDay = useStore((s) => s.planDay);
  const data = useStore();
  const now = useNow(60_000);
  const days = streak(data, now);
  const [widget, setWidget] = useWidget();
  const mod = isMac ? "⌘" : "Ctrl ";

  return (
    <aside className="sidebar" data-tauri-drag-region>
      <div className="brand" data-tauri-drag-region>
        <span className="brand-mark" aria-hidden><i /><i /><i /><i /></span>
        <div>
          <b>Tomo</b>
          <span>un passo alla volta</span>
        </div>
      </div>
      <nav className="nav">
        {ITEMS.map(({ id, label, Icon, tone }, i) => (
          <button key={id} className={tone + (view === id ? " on" : "")} onClick={() => setView(id)}>
            {view === id && <motion.span layoutId="nav-pill" className="pill" transition={spring} />}
            <span className="nav-ico"><Icon size={17} weight={view === id ? "fill" : "bold"} /></span>
            <span>{label}</span>
            <kbd>{mod}{i + 1}</kbd>
          </button>
        ))}
      </nav>
      <div className="side-foot">
        <div className="side-streak c-peach">
          <FireIcon size={22} weight="fill" className={days ? "flame" : undefined} color={days ? "#ff9b62" : "#e2c9b4"} />
          <b>{days}</b>
          <span>{days === 1 ? "giorno di fila" : "giorni di fila"}</span>
        </div>
        <label className="plan-day">
          <span>Giorno del piano</span>
          <select value={planDay} onChange={(e) => setPlanDay(Number(e.target.value))}>
            {DAY_LONG.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </label>
        {isTauri && (
          <button className={"widget-toggle" + (widget ? " on" : "")} onClick={() => setWidget(!widget)}>
            <SquaresFourIcon size={15} weight={widget ? "fill" : "bold"} />
            {widget ? "Togli il widget" : "Widget sulla scrivania"}
          </button>
        )}
        <input
          className="name-input"
          value={name}
          placeholder="Come ti chiami?"
          onChange={(e) => setName(e.target.value)}
          spellCheck={false}
        />
      </div>
    </aside>
  );
}
