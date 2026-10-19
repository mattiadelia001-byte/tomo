import type { Data, Goal, Task, TaskState } from "./types";
import { addDays, dateKey, fmtTime, PART_LABEL, PART_START, startOfWeek, weekday, weekDates } from "./time";

export function taskState(t: Task, today: string): TaskState {
  if (t.status) return t.status;
  return t.date < today ? "missed" : "open";
}

const sortKey = (t: Task) => t.time ?? (t.part ? PART_START[t.part] : 1e9);

/** Timed tasks and parts of the day first, in order; then the others in the order they were added. */
export function tasksOn(data: Data, date: string): Task[] {
  return data.tasks
    .filter((t) => t.date === date)
    .sort((a, b) => sortKey(a) - sortKey(b) || a.created - b.created);
}

/** "18:30", "Mattina", or nothing for tasks that can happen any time of the day. */
export const fmtWhen = (t: Task) => (t.time !== undefined ? fmtTime(t.time) : t.part && PART_LABEL[t.part]);

export function weekTasks(data: Data, monday: Date): Task[] {
  const dates = new Set(weekDates(monday));
  return data.tasks.filter((t) => dates.has(t.date));
}

const amount = (goal: Goal, t: Task) => (goal.kind === "sessions" ? 1 : t.duration ?? 0);

export function goalProgress(data: Data, goal: Goal, monday: Date): number {
  return weekTasks(data, monday)
    .filter((t) => t.categoryId === goal.categoryId && t.status === "done")
    .reduce((sum, t) => sum + amount(goal, t), 0);
}

/** How much of the goal the week's plan covers, if everything gets done. */
export function goalPlanned(data: Data, goal: Goal, monday: Date): number {
  return weekTasks(data, monday)
    .filter((t) => t.categoryId === goal.categoryId && t.status !== "skipped")
    .reduce((sum, t) => sum + amount(goal, t), 0);
}

/**
 * Days in a row with at least one task done. Days with nothing planned, or where
 * everything was deliberately skipped, don't break it. Today counts only once something is done.
 */
export function streak(data: Data, now: Date): number {
  const today = dateKey(now);
  const byDate = new Map<string, Task[]>();
  for (const t of data.tasks) byDate.set(t.date, [...(byDate.get(t.date) ?? []), t]);
  const first = [...byDate.keys()].sort()[0];
  let count = 0;
  for (let d = new Date(now); first && dateKey(d) >= first; d = addDays(d, -1)) {
    const date = dateKey(d);
    const list = byDate.get(date) ?? [];
    if (list.some((t) => t.status === "done")) count++;
    else if (date !== today && list.some((t) => taskState(t, today) === "missed")) break;
  }
  return count;
}

export function weekOf(now: Date, offset = 0): Date {
  return addDays(startOfWeek(now), offset * 7);
}

/**
 * The week the planning day is for: on Monday it's the current week,
 * on any other day the next one.
 */
export const planWeekOffset = (planDay: number) => (planDay === 0 ? 0 : 1);

export const isPlanDay = (data: Data, now: Date) => weekday(now) === data.planDay;
