import type { Category, ColorKey } from "./types";

export const COLORS: ColorKey[] = ["rose", "lavender", "sky", "mint", "butter", "peach"];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "palestra", name: "Palestra", color: "rose", icon: "barbell" },
  { id: "studio", name: "Studio", color: "lavender", icon: "book" },
  { id: "lavoro", name: "Lavoro", color: "sky", icon: "briefcase" },
  { id: "personale", name: "Personale", color: "mint", icon: "leaf" },
  { id: "pausa", name: "Pausa", color: "butter", icon: "coffee" },
];
