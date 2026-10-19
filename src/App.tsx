import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, MotionConfig } from "motion/react";
import { setView, useStore, type View } from "./state/store";
import { isMac, onAppEvent, windowLabel } from "./platform";
import { Sidebar } from "./components/Sidebar";
import { TaskDialog } from "./components/TaskDialog";
import { GoalDialog } from "./components/GoalDialog";
import { Confetti, ease } from "./components/ui";
import { TodayView } from "./views/TodayView";
import { WeekView } from "./views/WeekView";
import { GoalsView } from "./views/GoalsView";
import { WidgetView } from "./views/WidgetView";

const VIEWS: Record<View, () => React.JSX.Element> = { today: TodayView, week: WeekView, goals: GoalsView };
const ORDER: View[] = ["today", "week", "goals"];

function useHydrated() {
  const [ok, setOk] = useState(() => useStore.persist.hasHydrated());
  useEffect(() => {
    const off = useStore.persist.onFinishHydration(() => setOk(true));
    // hydration may have finished between the first render and this effect
    if (useStore.persist.hasHydrated()) setOk(true);
    return off;
  }, []);
  return ok;
}

function useShortcuts() {
  useEffect(() => {
    if (windowLabel === "widget") return;
    const onKey = (e: KeyboardEvent) => {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (!mod) return;
      const s = useStore.getState();
      if (s.taskDialog || s.goalDialog) return;
      const n = Number(e.key);
      if (n >= 1 && n <= ORDER.length) { e.preventDefault(); setView(ORDER[n - 1]); }
      if (e.key.toLowerCase() === "n") { e.preventDefault(); useStore.setState({ taskDialog: {} }); }
    };
    window.addEventListener("keydown", onKey);
    // "+" in the widget
    const offNewTask = onAppEvent("tomo:new-task", () => useStore.setState({ taskDialog: {} }));
    return () => { window.removeEventListener("keydown", onKey); offNewTask(); };
  }, []);
}

export function App() {
  const hydrated = useHydrated();
  const view = useStore((s) => s.view);
  const toastMsg = useStore((s) => s.toast);
  const scrollRef = useRef<HTMLDivElement>(null);
  useShortcuts();

  if (!hydrated) return null;
  if (windowLabel === "widget") return (
    <MotionConfig reducedMotion="user">
      <WidgetView />
      <Confetti />
    </MotionConfig>
  );
  const Page = VIEWS[view];

  return (
    <MotionConfig reducedMotion="user">
      <div className={"app" + (isMac ? " mac" : "")}>
        <div className="ambient" aria-hidden><i /><i /><i /></div>
        <Sidebar />
        <main className="main">
          <div className="drag" data-tauri-drag-region />
          <div className="scroll" ref={scrollRef}>
            <AnimatePresence mode="wait" initial={false} onExitComplete={() => scrollRef.current?.scrollTo(0, 0)}>
              <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease }}>
                <Page />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        <TaskDialog />
        <GoalDialog />
        <Confetti />
        <AnimatePresence>
          {toastMsg && (
            <motion.div className="toast" initial={{ opacity: 0, y: 12, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 8, x: "-50%" }} transition={{ duration: 0.3, ease }}>
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
