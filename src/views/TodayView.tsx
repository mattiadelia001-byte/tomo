import { useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowBendUpRightIcon, ArrowRightIcon, CalendarCheckIcon, NoteIcon, CalendarPlusIcon, ClockCounterClockwiseIcon, FireIcon,
  LightbulbIcon, PlusIcon, SunHorizonIcon, TargetIcon,
} from "@phosphor-icons/react";
import { celebrate, moveToToday, moveToTomorrow, openWeek, setPlanDay, setStatus, toast, useStore } from "../state/store";
import { fmtWhen, goalProgress, isPlanDay, planWeekOffset, taskState, tasksOn, streak, weekOf, weekTasks } from "../model/selectors";
import { addDays, dateKey, DAY_LONG, DAY_SHORT, fmtDuration, fmtHours, fmtLongDate, fmtWeekRange, greeting, parseKey, weekday, weekDates } from "../model/time";
import { TIPS, tipOfDay } from "../model/tips";
import type { Goal, Task } from "../model/types";
import { Bar, Check, CheckButton, ease, Ring, Tag, tone, useCategory } from "../components/ui";
import { useNow } from "../hooks/useNow";

const list = { show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } };

const addFor = (date: string) => useStore.setState({ taskDialog: { date } });

export function TodayView() {
  const data = useStore();
  const now = useNow();
  const today = dateKey(now);
  const tasks = tasksOn(data, today);
  const open = tasks.filter((t) => !t.status).length;
  const name = data.name.trim();
  const fresh = data.tasks.length === 0;
  const days = streak(data, now);

  let sub = "Niente in programma per oggi.";
  if (tasks.length && !open) sub = "Hai fatto tutto quello che avevi in programma.";
  else if (tasks.length) sub = `${open === 1 ? "Ti resta un'attività" : `Ti restano ${open} attività`} per oggi.`;

  return (
    <div className="page">
      <motion.header className="page-head" initial="hidden" animate="show" variants={item}>
        <div>
          <h1>{greeting(now)}{name && `, ${name}`}</h1>
          <p className="sub"><span style={{ textTransform: "capitalize" }}>{fmtLongDate(now)}</span>{!fresh && ` · ${sub}`}</p>
        </div>
        <div className="head-streak c-peach" title="Giorni di fila con almeno un'attività fatta">
          <FireIcon size={20} weight="fill" className={days ? "flame" : undefined} color={days ? "#ff9b62" : "#e2c9b4"} />
          <b>{days}</b>
          <span>{days === 1 ? "giorno di fila" : "giorni di fila"}</span>
        </div>
      </motion.header>
      <motion.div className="today" initial="hidden" animate="show" variants={list}>
        <div className="col">
          {fresh ? (
            <motion.div variants={item}><Welcome /></motion.div>
          ) : (
            <>
              <PlanBanner now={now} />
              <motion.div variants={item}><TodayCard tasks={tasks} today={today} /></motion.div>
              <Behind now={now} />
              <Tomorrow now={now} />
            </>
          )}
        </div>
        <div className="col">
          <motion.div variants={item}><ProgressCard tasks={tasks} /></motion.div>
          <motion.div variants={item}><GoalsCard goals={data.goals} now={now} /></motion.div>
          <motion.div variants={item}><StreakCard now={now} /></motion.div>
          <motion.div variants={item}><TipCard now={now} /></motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// ---------- first launch ----------

function Welcome() {
  const planDay = useStore((s) => s.planDay);
  return (
    <div className="hero c-lavender">
      <span className="eyebrow">Benvenuto in Tomo</span>
      <h2>Una settimana alla volta.</h2>
      <p className="lead">Un giorno a settimana decidi cosa fare nei sette giorni successivi. Poi, ogni giorno, Tomo ti ricorda cosa ti eri promesso e tu spunti quello che fai.</p>
      <ol className="steps">
        <li>
          <span className="n">1</span>
          <div>
            <b>Scegli il giorno del piano</b>
            <div className="chips" style={{ marginTop: 10 }}>
              {DAY_SHORT.map((d, i) => (
                <button key={d} type="button" className={"chip day" + (planDay === i ? " on" : "")} onClick={() => setPlanDay(i)}>{d}</button>
              ))}
            </div>
            <p className="hint" style={{ marginTop: 8 }}>Ogni {DAY_LONG[planDay].toLowerCase()} Tomo ti inviterà a pianificare la settimana dopo. Puoi cambiarlo quando vuoi in basso a sinistra.</p>
          </div>
        </li>
        <li>
          <span className="n">2</span>
          <div>
            <b>Pianifica questa settimana</b>
            <p className="hint">Palestra, studio, lavoro, commissioni. Con un orario solo se ti serve.</p>
            <button className="btn primary" style={{ marginTop: 12 }} onClick={() => openWeek(0)}>
              <CalendarPlusIcon size={16} weight="bold" /> Inizia il piano
            </button>
          </div>
        </li>
        <li>
          <span className="n">3</span>
          <div>
            <b>Ogni giorno, spunta</b>
            <p className="hint">Quello che non fai lo sposti, senza sensi di colpa.</p>
          </div>
        </li>
      </ol>
    </div>
  );
}

// ---------- planning ----------

function PlanBanner({ now }: { now: Date }) {
  const data = useStore();
  const planDay = isPlanDay(data, now);
  const offset = planDay ? planWeekOffset(data.planDay) : 0;
  const count = weekTasks(data, weekOf(now, offset)).length;
  // on the planning day, or whenever the current week has no plan at all
  if (!planDay && count > 0) return null;

  const range = fmtWeekRange(weekOf(now, offset));
  const title = planDay ? "Oggi è il giorno del piano" : "Questa settimana non ha ancora un piano";
  const text = planDay
    ? count
      ? `Per la settimana ${range} hai già ${count} attività. Dai un'ultima occhiata.`
      : `Prenditi dieci minuti per decidere cosa fare dal ${range}.`
    : "Bastano pochi minuti: decidi cosa fare nei prossimi giorni.";

  return (
    <motion.div variants={item} className="banner c-butter">
      <span className="banner-ico"><SunHorizonIcon size={22} weight="fill" /></span>
      <div className="grow">
        <b>{title}</b>
        <p>{text}</p>
      </div>
      <button className="btn primary" onClick={() => openWeek(offset)}>
        Pianifica <ArrowRightIcon size={14} weight="bold" />
      </button>
    </motion.div>
  );
}

// ---------- today ----------

function TodayCard({ tasks, today }: { tasks: Task[]; today: string }) {
  const done = tasks.filter((t) => t.status === "done").length;
  return (
    <div className="card day-card">
      <div className="card-head">
        <span className="head-ico c-lavender"><CalendarCheckIcon size={16} weight="fill" /></span>
        <h2>Da fare oggi</h2>
        {tasks.length > 0 && <span className="right count">{done} di {tasks.length}</span>}
      </div>
      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>Per oggi non avevi programmato niente.</p>
          <p className="hint">Una giornata libera va benissimo.</p>
        </div>
      ) : (
        <motion.div className="tasks" initial="hidden" animate="show" variants={list}>
          {tasks.map((t) => <Row key={t.id} task={t} today={today} />)}
        </motion.div>
      )}
      <button className="add-row" onClick={() => addFor(today)}>
        <PlusIcon size={14} weight="bold" /> Aggiungi per oggi
      </button>
    </div>
  );
}

export function useToggle(task: Task) {
  return (e: MouseEvent) => {
    if (task.status === "done") return setStatus(task.id, null);
    setStatus(task.id, "done");
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    celebrate(r.left + r.width / 2, r.top + r.height / 2);
  };
}

function Row({ task, today }: { task: Task; today: string }) {
  const cat = useCategory(task.categoryId);
  const state = taskState(task, today);
  const toggle = useToggle(task);
  const edit = () => useStore.setState({ taskDialog: { id: task.id } });

  return (
    <motion.div variants={item} layout="position" className={`task-row ${state} ${tone(cat)}`}>
      <CheckButton on={state === "done"} onToggle={toggle} label={state === "done" ? "Segna come da fare" : "Segna come fatto"} />
      <button className="body" onClick={edit}>
        <span className="title">{task.title}</span>
        <span className="info">
          <Tag category={cat} />
          {fmtWhen(task) && <span className="time">{fmtWhen(task)}</span>}
          {task.duration && <span>{fmtDuration(task.duration)}</span>}
          {state === "skipped" && <span>saltata</span>}
        </span>
        {task.note && state !== "done" && <span className="note"><NoteIcon size={12} weight="bold" /><span>{task.note}</span></span>}
      </button>
      {state === "open" && (
        <button className="btn quiet later" title="Sposta a domani" onClick={() => { moveToTomorrow(task.id); toast("Spostata a domani."); }}>
          <ArrowBendUpRightIcon size={14} weight="bold" /> Domani
        </button>
      )}
    </motion.div>
  );
}

/** Tasks of the last seven days left undone: move them to today or let them go. */
function Behind({ now }: { now: Date }) {
  const tasks = useStore((s) => s.tasks);
  const today = dateKey(now);
  const since = dateKey(addDays(now, -7));
  const missed = tasks.filter((t) => t.date >= since && taskState(t, today) === "missed").sort((a, b) => a.date.localeCompare(b.date));
  if (!missed.length) return null;

  return (
    <motion.div variants={item} className="card">
      <div className="card-head">
        <span className="head-ico c-peach"><ClockCounterClockwiseIcon size={16} weight="bold" /></span>
        <h2>Rimasti indietro</h2>
        <span className="right hint">Succede. Decidi tu cosa farne.</span>
      </div>
      <div className="tasks">
        <AnimatePresence initial={false}>
          {missed.map((t) => <BehindRow key={t.id} task={t} today={today} />)}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function BehindRow({ task, today }: { task: Task; today: string }) {
  const cat = useCategory(task.categoryId);
  const toggle = useToggle(task);
  const yesterday = dateKey(addDays(parseKey(today), -1));
  const when = task.date === yesterday ? "ieri" : DAY_LONG[weekday(parseKey(task.date))].toLowerCase();
  return (
    <motion.div
      layout="position"
      className={"task-row missed " + tone(cat)}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3, ease }}
    >
      <CheckButton on={false} onToggle={toggle} label="Fatta comunque" />
      <div className="body">
        <span className="title">{task.title}</span>
        <span className="info"><Tag category={cat} /><span>{when}</span></span>
      </div>
      <div className="actions">
        <button className="btn quiet" onClick={() => moveToToday(task.id)}>Fallo oggi</button>
        <button className="btn quiet" onClick={() => setStatus(task.id, "skipped")}>Lascia stare</button>
      </div>
    </motion.div>
  );
}

function Tomorrow({ now }: { now: Date }) {
  const data = useStore();
  const date = dateKey(addDays(now, 1));
  const tasks = tasksOn(data, date);
  return (
    <motion.div variants={item} className="card">
      <div className="card-head">
        <span className="head-ico c-sky"><ArrowRightIcon size={15} weight="bold" /></span>
        <h2>Domani</h2>
        <button className="right link" onClick={() => addFor(date)}>Aggiungi</button>
      </div>
      {tasks.length === 0 ? (
        <p className="hint">Ancora niente in programma.</p>
      ) : (
        <div className="mini-list">
          {tasks.map((t) => <MiniTask key={t.id} task={t} />)}
        </div>
      )}
    </motion.div>
  );
}

function MiniTask({ task }: { task: Task }) {
  const cat = useCategory(task.categoryId);
  return (
    <button className={"mini-task " + tone(cat)} onClick={() => useStore.setState({ taskDialog: { id: task.id } })}>
      <i />
      <span>{task.title}</span>
      {fmtWhen(task) && <small>{fmtWhen(task)}</small>}
    </button>
  );
}

// ---------- right column ----------

function ProgressCard({ tasks }: { tasks: Task[] }) {
  const counted = tasks.filter((t) => t.status !== "skipped");
  const done = counted.filter((t) => t.status === "done").length;
  const ratio = counted.length ? done / counted.length : 0;
  let sub = "attività fatte oggi";
  if (counted.length && done === counted.length) sub = "giornata completata";
  return (
    <div className="card tint ring-card c-mint">
      <Ring value={ratio}>{Math.round(ratio * 100)}%</Ring>
      <div>
        <div className="big">{done} di {counted.length}</div>
        <div className="sub">{sub}</div>
      </div>
    </div>
  );
}

function goalLabel(goal: Goal, value: number) {
  return goal.kind === "sessions" ? `${value} / ${goal.target}` : `${fmtHours(value)} / ${fmtHours(goal.target)} h`;
}

function GoalsCard({ goals, now }: { goals: Goal[]; now: Date }) {
  const data = useStore();
  const monday = weekOf(now);
  return (
    <div className="card">
      <div className="card-head">
        <span className="head-ico c-rose"><TargetIcon size={16} weight="fill" /></span>
        <h2>Obiettivi della settimana</h2>
        {goals.length > 0 && <button className="right link" onClick={() => useStore.setState({ view: "goals" })}>Tutti</button>}
      </div>
      {goals.length === 0 ? (
        <>
          <p className="hint">Per esempio: palestra 3 volte, studio 6 ore. Vedrai qui come procedi.</p>
          <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => useStore.setState({ goalDialog: {} })}>
            <PlusIcon size={14} weight="bold" /> Aggiungi un obiettivo
          </button>
        </>
      ) : (
        goals.map((g) => <GoalMini key={g.id} goal={g} value={goalProgress(data, g, monday)} />)
      )}
    </div>
  );
}

function GoalMini({ goal, value }: { goal: Goal; value: number }) {
  const cat = useCategory(goal.categoryId);
  return (
    <div className={"goal-mini " + tone(cat)}>
      <div className="top">
        <Tag category={cat} />
        <span className="val">{goalLabel(goal, value)}</span>
      </div>
      <Bar value={value / goal.target} />
    </div>
  );
}

function StreakCard({ now }: { now: Date }) {
  const data = useStore();
  const days = streak(data, now);
  const today = dateKey(now);
  const dates = weekDates(weekOf(now));
  return (
    <div className="card tint c-peach">
      <div className="card-head">
        <span className="head-ico"><FireIcon size={16} weight="fill" /></span>
        <h2>Costanza</h2>
      </div>
      <div className="streak-row">
        <motion.span key={days} className="big" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4, ease }}>{days}</motion.span>
        <span className="muted" style={{ paddingBottom: 4 }}>{days === 1 ? "giorno di fila" : "giorni di fila"} con almeno un'attività fatta</span>
      </div>
      <div className="week-dots">
        {dates.map((d, i) => {
          const list = tasksOn(data, d);
          let cls = "";
          if (list.some((t) => t.status === "done")) cls = "done";
          else if (!list.length) cls = "rest";
          else if (list.some((t) => taskState(t, today) === "missed")) cls = "missed";
          return (
            <div key={d} className={d === today ? "today" : ""}>
              <i className={cls}>{cls === "done" && <Check />}</i>
              {DAY_SHORT[i]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TipCard({ now }: { now: Date }) {
  const [index, setIndex] = useState(() => tipOfDay(now));
  const tip = TIPS[index];
  return (
    <div className="card tint tip c-butter">
      <div className="card-head">
        <span className="head-ico"><LightbulbIcon size={16} weight="fill" /></span>
        <h2>Contro il rimandare</h2>
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={index} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease }}>
          <p>{tip.text}</p>
          <div className="src">
            <span>{tip.source}</span>
            <button className="link" onClick={() => setIndex((index + 1) % TIPS.length)}>Un altro</button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
