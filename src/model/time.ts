import type { DayPart } from "./types";
const pad = (n: number) => String(n).padStart(2, "0");

export const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 0 = Monday … 6 = Sunday */
export const weekday = (d: Date) => (d.getDay() + 6) % 7;

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export const startOfWeek = (d: Date) => {
  const r = addDays(d, -weekday(d));
  r.setHours(0, 0, 0, 0);
  return r;
};

export const weekDates = (monday: Date) => Array.from({ length: 7 }, (_, i) => dateKey(addDays(monday, i)));

export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();

export const fmtTime = (min: number) => `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

export function parseTime(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

export const fmtHours = (min: number) =>
  (Math.round((min / 60) * 10) / 10).toLocaleString("it-IT", { maximumFractionDigits: 1 });

export const DAY_PARTS: [DayPart, string][] = [["morning", "Mattina"], ["afternoon", "Pomeriggio"], ["evening", "Sera"]];
export const PART_LABEL = Object.fromEntries(DAY_PARTS) as Record<DayPart, string>;
/** where a part of the day sorts among timed tasks */
export const PART_START: Record<DayPart, number> = { morning: 0, afternoon: 13 * 60, evening: 18 * 60 };

export const DAY_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
export const DAY_LONG = ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato", "Domenica"];

const longDate = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });
export const fmtLongDate = (d: Date) => longDate.format(d);

const monthFmt = new Intl.DateTimeFormat("it-IT", { month: "long" });
export function fmtWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  return sameMonth
    ? `${monday.getDate()} – ${sunday.getDate()} ${monthFmt.format(sunday)}`
    : `${monday.getDate()} ${monthFmt.format(monday)} – ${sunday.getDate()} ${monthFmt.format(sunday)}`;
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Buonanotte";
  if (h < 13) return "Buongiorno";
  if (h < 18) return "Buon pomeriggio";
  return "Buonasera";
}
