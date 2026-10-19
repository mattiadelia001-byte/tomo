import { motion } from "motion/react";
import { CheckCircleIcon, InfoIcon, PencilSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { openWeek, useStore } from "../state/store";
import { goalPlanned, goalProgress, weekOf } from "../model/selectors";
import { dateKey, fmtHours } from "../model/time";
import type { Data, Goal } from "../model/types";
import { Bar, ease, Tag, tone, useCategory } from "../components/ui";
import { useNow } from "../hooks/useNow";

const WEEKS = 8;

/** Monday of the first week with any data, so history doesn't start with fake empty weeks. */
function firstWeek(data: Data): string {
  const min = data.tasks.map((t) => t.date).sort()[0] ?? dateKey(new Date());
  const [y, m, d] = min.split("-").map(Number);
  return dateKey(weekOf(new Date(y, m - 1, d)));
}

export function GoalsView() {
  const goals = useStore((s) => s.goals);
  return (
    <div className="page">
      <motion.header className="page-head" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}>
        <div>
          <h1>Obiettivi</h1>
          <p className="sub">Un traguardo per settimana: abbastanza vicino da sentirlo, abbastanza piccolo da raggiungerlo.</p>
        </div>
      </motion.header>
      <motion.div className="goals" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
        {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        <motion.button
          className="goal-new"
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
          onClick={() => useStore.setState({ goalDialog: {} })}
        >
          <span className="plus"><PlusIcon size={20} weight="bold" /></span>
          Nuovo obiettivo
        </motion.button>
      </motion.div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const data = useStore();
  const now = useNow(60_000);
  const cat = useCategory(goal.categoryId);
  const monday = weekOf(now);
  const value = goalProgress(data, goal, monday);
  const planned = goalPlanned(data, goal, monday);
  const fmt = (v: number) => (goal.kind === "sessions" ? String(v) : fmtHours(v));
  const unit = goal.kind === "sessions" ? (goal.target === 1 ? "sessione" : "sessioni") : "ore";

  const first = firstWeek(data);
  const history = Array.from({ length: WEEKS }, (_, i) => {
    const m = weekOf(now, i - WEEKS + 1);
    return { monday: m, value: dateKey(m) >= first ? goalProgress(data, goal, m) : null };
  });
  const tracked = history.filter((h) => h.value !== null);
  const met = tracked.filter((h) => h.value! >= goal.target).length;

  return (
    <motion.div
      className={"card tint goal-card " + tone(cat)}
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease } } }}
    >
      <div className="card-head" style={{ marginBottom: 0 }}>
        <Tag category={cat} />
        <button className="right icon-btn" title="Modifica" onClick={() => useStore.setState({ goalDialog: { id: goal.id } })}>
          <PencilSimpleIcon size={15} weight="bold" />
        </button>
      </div>

      <div>
        <div className="num">
          <b>{fmt(value)}</b>
          <span>/ {fmt(goal.target)} {unit} questa settimana</span>
        </div>
      </div>
      <div>
        <Bar value={value / goal.target} planned={planned / goal.target} />
        <p className="hint" style={{ marginTop: 6 }}>La parte chiara è quanto copre il piano della settimana.</p>
      </div>

      {value >= goal.target ? (
        <p className="note"><CheckCircleIcon size={15} weight="fill" /> Obiettivo raggiunto. Tutto quello che fai in più è un regalo.</p>
      ) : planned < goal.target ? (
        <p className="note">
          <InfoIcon size={15} weight="bold" />
          <span>
            Il piano di questa settimana arriva a {fmt(planned)} su {fmt(goal.target)}.{" "}
            <button className="link" onClick={() => openWeek(0)}>Aggiungi qualcosa al piano</button>
          </span>
        </p>
      ) : (
        <p className="note"><InfoIcon size={15} weight="bold" /> Il piano basta: se fai quello che hai in programma, ci arrivi.</p>
      )}

      {goal.why && <p className="why">{goal.why}</p>}

      <div>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          Ultime settimane{tracked.length > 1 && ` · raggiunto ${met} su ${tracked.length}`}
        </div>
        <div className="history">
          {history.map((h, i) => (
            <div key={i}>
              {h.value !== null && (
                <motion.i
                  className={h.value >= goal.target ? "" : "miss"}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: Math.max(0.06, Math.min(1, h.value / goal.target)) }}
                  transition={{ duration: 0.7, ease, delay: 0.2 + i * 0.04 }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="history-labels">
          {history.map((h, i) => <span key={i}>{i === WEEKS - 1 ? "ora" : `${h.monday.getDate()}/${h.monday.getMonth() + 1}`}</span>)}
        </div>
      </div>
    </motion.div>
  );
}
