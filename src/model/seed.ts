import type { Data } from "./types";
import { DEFAULT_CATEGORIES } from "./categories";

export const emptyData = (): Data => ({ name: "", planDay: 6, categories: DEFAULT_CATEGORIES, tasks: [], goals: [] });
