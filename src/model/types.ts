export type ColorKey = "rose" | "lavender" | "sky" | "mint" | "butter" | "peach";
export type IconKey =
  | "barbell" | "book" | "briefcase" | "leaf" | "coffee" | "sparkle"
  | "run" | "bike" | "music" | "paint" | "code" | "graduation" | "brain" | "heart"
  | "house" | "cart" | "wallet" | "users" | "moon" | "food";

export interface Category {
  id: string;
  name: string;
  color: ColorKey;
  icon: IconKey;
}

export type Status = "done" | "skipped";

export type DayPart = "morning" | "afternoon" | "evening";

/** Something planned for a specific day. Time and duration are optional. */
export interface Task {
  id: string;
  title: string;
  categoryId: string;
  /** YYYY-MM-DD */
  date: string;
  /** minutes from midnight */
  time?: number;
  /** rough moment of the day, for tasks without an exact time */
  part?: DayPart;
  /** minutes; counts towards hour-based goals */
  duration?: number;
  note?: string;
  status?: Status;
  /** creation time, keeps the order of tasks without a time stable */
  created: number;
}

export interface Goal {
  id: string;
  categoryId: string;
  kind: "sessions" | "minutes";
  /** sessions per week, or minutes per week */
  target: number;
  why: string;
}

export interface Data {
  name: string;
  /** weekday when the next week gets planned, 0 = Monday */
  planDay: number;
  categories: Category[];
  tasks: Task[];
  goals: Goal[];
}

/** "missed": a past day's task that was neither done nor skipped */
export type TaskState = "done" | "skipped" | "missed" | "open";
