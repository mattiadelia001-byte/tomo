import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Category, Data, Goal, Status, Task } from "../model/types";
import { emptyData } from "../model/seed";
import { addDays, dateKey, parseKey } from "../model/time";
import { uid } from "../model/uid";
import { loadData, onAppEvent, saveData, windowLabel } from "../platform";

export type View = "today" | "week" | "goals";

/** Task dialog: edit `id`, or create on `date` (any day of that week can then be picked). */
export type TaskDraft = { id?: string; date?: string };

interface UI {
  view: View;
  /** week shown in the week view, relative to the current one */
  weekOffset: number;
  taskDialog: TaskDraft | null;
  goalDialog: { id?: string } | null;
  toast: string | null;
  /** confetti burst origin; `n` changes on every burst */
  burst: { x: number; y: number; n: number } | null;
}

type State = Data & UI;

export const useStore = create<State>()(
  persist(
    (): State => ({
      ...emptyData(),
      view: "today",
      weekOffset: 0,
      taskDialog: null,
      goalDialog: null,
      toast: null,
      burst: null,
    }),
    {
      name: "tomo",
      version: 3,
      storage: createJSONStorage(() => ({
        // a failed read must not leave the app blank: start from the defaults instead
        getItem: () => loadData().catch((e) => { console.error("load failed", e); return null; }),
        setItem: (_, value) => saveData(value),
        removeItem: () => {},
      })),
      partialize: ({ name, planDay, categories, tasks, goals }): Data => ({ name, planDay, categories, tasks, goals }),
      // v1 was a recurring weekly template filled with example data: start over, keep the name.
      // v3 only added the optional `Task.part`, so v2 data is valid as is.
      migrate: (old, version) => (version < 2 ? { ...emptyData(), name: (old as Partial<Data>)?.name ?? "" } : old) as Data,
    },
  ),
);

// the main window and the desktop widget share the data file: reload it when the other one saves
onAppEvent<string>("tomo:saved", (from) => {
  if (from !== windowLabel) useStore.persist.rehydrate();
});

const set = useStore.setState;
const get = useStore.getState;

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export function toast(message: string, ms = 2600) {
  clearTimeout(toastTimer);
  set({ toast: message });
  toastTimer = setTimeout(() => set({ toast: null }), ms);
}

export const setView = (view: View) => set({ view });
export const setName = (name: string) => set({ name });
export const setPlanDay = (planDay: number) => set({ planDay });
export const openWeek = (weekOffset: number) => set({ view: "week", weekOffset });

export const findTask = (id: string) => get().tasks.find((t) => t.id === id);

// ---------- tasks ----------

export type TaskInput = Pick<Task, "title" | "categoryId" | "time" | "part" | "duration" | "note">;

/** One task per selected date. */
export function addTasks(input: TaskInput, dates: string[]) {
  const now = Date.now();
  const created: Task[] = dates.map((date, i) => ({ ...input, id: uid(), date, created: now + i }));
  set({ tasks: [...get().tasks, ...created] });
}

export function updateTask(id: string, patch: Partial<Task>) {
  set({ tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) });
}

export function deleteTask(id: string) {
  set({ tasks: get().tasks.filter((t) => t.id !== id) });
}

export function setStatus(id: string, status: Status | null) {
  updateTask(id, { status: status ?? undefined });
}

/** Moving a task to another day reopens it. */
export function moveTask(id: string, date: string) {
  updateTask(id, { date, status: undefined });
}

export function moveToToday(id: string) {
  moveTask(id, dateKey(new Date()));
}

export function moveToTomorrow(id: string) {
  moveTask(id, dateKey(addDays(parseKey(dateKey(new Date())), 1)));
}

export function celebrate(x: number, y: number) {
  set({ burst: { x, y, n: (get().burst?.n ?? 0) + 1 } });
}

// ---------- categories ----------

export function addCategory(input: Omit<Category, "id">): string {
  const id = uid();
  set({ categories: [...get().categories, { ...input, id }] });
  return id;
}

export function updateCategory(id: string, patch: Omit<Category, "id">) {
  set({ categories: get().categories.map((c) => (c.id === id ? { ...patch, id } : c)) });
}

/** Its tasks stay (shown as "Altro"); its goals go, since they can't be tracked anymore. */
export function deleteCategory(id: string) {
  set({
    categories: get().categories.filter((c) => c.id !== id),
    goals: get().goals.filter((g) => g.categoryId !== id),
  });
}

// ---------- goals ----------

export function saveGoal(goal: Omit<Goal, "id"> & { id?: string }) {
  const goals = get().goals;
  set({
    goals: goal.id
      ? goals.map((g) => (g.id === goal.id ? (goal as Goal) : g))
      : [...goals, { ...goal, id: uid() }],
  });
}

export function deleteGoal(id: string) {
  set({ goals: get().goals.filter((g) => g.id !== id) });
}
