import { useEffect, useMemo, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarbellIcon, BicycleIcon, BookOpenIcon, BrainIcon, BriefcaseIcon, CheckIcon, CodeIcon, CoffeeIcon, ForkKnifeIcon,
  GraduationCapIcon, HeartIcon, HouseIcon, LeafIcon, MoonIcon, MusicNotesIcon, PaintBrushIcon, PersonSimpleRunIcon,
  ShoppingCartIcon, SparkleIcon, UsersIcon, WalletIcon, type IconProps,
} from "@phosphor-icons/react";
import type { Category, IconKey } from "../model/types";
import { useStore } from "../state/store";

export const spring = { type: "spring", stiffness: 420, damping: 32 } as const;
export const ease = [0.16, 1, 0.3, 1] as const;

const ICONS: Record<IconKey, [React.ComponentType<IconProps>, string]> = {
  barbell: [BarbellIcon, "Pesi"],
  run: [PersonSimpleRunIcon, "Corsa"],
  bike: [BicycleIcon, "Bici"],
  book: [BookOpenIcon, "Libro"],
  graduation: [GraduationCapIcon, "Università"],
  brain: [BrainIcon, "Mente"],
  briefcase: [BriefcaseIcon, "Lavoro"],
  code: [CodeIcon, "Codice"],
  wallet: [WalletIcon, "Soldi"],
  cart: [ShoppingCartIcon, "Spesa"],
  music: [MusicNotesIcon, "Musica"],
  paint: [PaintBrushIcon, "Arte"],
  leaf: [LeafIcon, "Foglia"],
  heart: [HeartIcon, "Cuore"],
  users: [UsersIcon, "Persone"],
  house: [HouseIcon, "Casa"],
  food: [ForkKnifeIcon, "Cibo"],
  coffee: [CoffeeIcon, "Caffè"],
  moon: [MoonIcon, "Sonno"],
  sparkle: [SparkleIcon, "Altro"],
};

export const ICON_KEYS = Object.keys(ICONS) as IconKey[];
export const iconLabel = (icon: IconKey) => ICONS[icon][1];

const FALLBACK: Category = { id: "?", name: "Altro", color: "peach", icon: "sparkle" };

export function useCategory(id: string): Category {
  return useStore((s) => s.categories.find((c) => c.id === id)) ?? FALLBACK;
}

export const tone = (c: Category) => `c-${c.color}`;

export function CategoryIcon({ icon, ...props }: { icon: IconKey } & IconProps) {
  const Icon = ICONS[icon][0];
  return <Icon weight="bold" {...props} />;
}

export function Tag({ category }: { category: Category }) {
  return (
    <span className={"tag " + tone(category)}>
      <CategoryIcon icon={category.icon} size={11} />
      {category.name}
    </span>
  );
}

/** Round checkbox: the check draws itself in, the circle pops. */
export function CheckButton({ on, onToggle, label }: { on: boolean; onToggle: (e: MouseEvent) => void; label: string }) {
  return (
    <motion.button
      className={"check" + (on ? " on" : "")}
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
      whileTap={{ scale: 0.85 }}
      animate={{ scale: on ? [1, 1.18, 1] : 1 }}
      transition={{ duration: 0.35, ease }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <motion.path
          d="M3 7.4 5.8 10 11 4.4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.3, ease, delay: on ? 0.05 : 0 }}
        />
      </svg>
    </motion.button>
  );
}

export function Ring({ value, size = 88, stroke = 8, color = "var(--c-dot)", track = "var(--ring-track, var(--canvas))", children }: {
  value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: Math.min(1, Math.max(0.0001, value)), opacity: value > 0 ? 1 : 0 }}
          transition={{ duration: 0.9, ease }}
        />
      </svg>
      <div className="label">{children}</div>
    </div>
  );
}

/** Progress bar animated with scaleX only. `planned` shows how far the plan would get you. */
export function Bar({ value, planned }: { value: number; planned?: number }) {
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return (
    <div className="bar">
      {planned !== undefined && (
        <motion.div className="planned" initial={{ scaleX: 0 }} animate={{ scaleX: clamp(planned) }} transition={{ duration: 0.9, ease }} />
      )}
      <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: clamp(value) }} transition={{ duration: 0.9, ease, delay: 0.1 }} />
    </div>
  );
}

export function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="dialog"
            role="dialog"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.3, ease }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const CONFETTI_COLORS = ["#ee9f8d", "#ae9dea", "#8bc0e8", "#8ccaa5", "#e7c769", "#f0b47e"];

/** Small burst of pastel confetti from the point that was clicked. */
export function Confetti() {
  const burst = useStore((s) => s.burst);
  const pieces = useMemo(
    () => Array.from({ length: 16 }, (_, i) => {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
      const dist = 40 + Math.random() * 50;
      return {
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist - 20,
        r: Math.random() * 260 - 130,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      };
    }),
    [burst?.n],
  );
  if (!burst) return null;
  return (
    <div className="confetti" key={burst.n}>
      {pieces.map((p, i) => (
        <motion.i
          key={i}
          style={{ left: burst.x - 4, top: burst.y - 4, background: p.color, borderRadius: p.round ? "50%" : 2 }}
          initial={{ x: 0, y: 0, scale: 0.6, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 40], scale: 1, opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export function Check({ size = 10 }: { size?: number }) {
  return <CheckIcon size={size} weight="bold" />;
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => (
        <button type="button" key={v} className={v === value ? "on" : ""} onClick={() => onChange(v)}>
          {v === value && <motion.span layoutId={"seg-" + options.map((o) => o[0]).join()} className="seg-pill" transition={spring} />}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
