import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PlusIcon } from "@phosphor-icons/react";
import { addCategory, useStore } from "../state/store";
import { COLORS } from "../model/categories";
import type { ColorKey, IconKey } from "../model/types";
import { CategoryIcon, ICON_KEYS, ease, iconLabel, tone } from "./ui";

const COLOR_LABELS: Record<ColorKey, string> = {
  rose: "Rosa", lavender: "Lavanda", sky: "Azzurro", mint: "Menta", butter: "Giallo", peach: "Pesca",
};

/** Category chips plus an inline form to create a new category, which then gets selected. */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const categories = useStore((s) => s.categories);
  const [adding, setAdding] = useState(false);

  return (
    <div className="field">
      <span className="label">Categoria</span>
      <div className="chips">
        {categories.map((c) => (
          <button type="button" key={c.id} className={"chip " + (c.id === value ? "on " + tone(c) : "")} onClick={() => onChange(c.id)}>
            <CategoryIcon icon={c.icon} size={14} /> {c.name}
          </button>
        ))}
        {!adding && (
          <button type="button" className="chip add" onClick={() => setAdding(true)}>
            <PlusIcon size={14} weight="bold" /> Nuova
          </button>
        )}
      </div>
      <AnimatePresence initial={false}>
        {adding && (
          <NewCategory
            onDone={(id) => {
              setAdding(false);
              if (id) onChange(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NewCategory({ onDone }: { onDone: (id?: string) => void }) {
  const categories = useStore((s) => s.categories);
  const [name, setName] = useState("");
  // start from a color no category uses yet
  const [color, setColor] = useState<ColorKey>(
    () => COLORS.find((c) => !categories.some((x) => x.color === c)) ?? COLORS[categories.length % COLORS.length],
  );
  const [icon, setIcon] = useState<IconKey>("sparkle");

  const create = () => {
    const n = name.trim();
    if (n) onDone(addCategory({ name: n, color, icon }));
  };

  return (
    <motion.div
      className={"new-cat c-" + color}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease }}
    >
      <div className="new-cat-head">
        <span className="new-cat-ico"><CategoryIcon icon={icon} size={20} /></span>
        <input
          className="input"
          autoFocus
          placeholder="Nome, es. Chitarra"
          aria-label="Nome della categoria"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            // keep Enter from submitting the dialog's form, and Escape from closing the dialog
            if (e.key === "Enter") { e.preventDefault(); create(); }
            if (e.key === "Escape") { e.stopPropagation(); onDone(); }
          }}
        />
      </div>

      <div className="swatches" role="radiogroup" aria-label="Colore">
        {COLORS.map((c) => (
          <button
            type="button" key={c} role="radio" aria-checked={c === color} aria-label={COLOR_LABELS[c]} title={COLOR_LABELS[c]}
            className={"swatch c-" + c + (c === color ? " on" : "")}
            onClick={() => setColor(c)}
          />
        ))}
      </div>

      <div className="icon-grid" role="radiogroup" aria-label="Icona">
        {ICON_KEYS.map((k) => (
          <button
            type="button" key={k} role="radio" aria-checked={k === icon} aria-label={iconLabel(k)} title={iconLabel(k)}
            className={"icon-pick" + (k === icon ? " on" : "")}
            onClick={() => setIcon(k)}
          >
            <CategoryIcon icon={k} size={18} />
          </button>
        ))}
      </div>

      <div className="new-cat-foot">
        <button type="button" className="btn quiet" onClick={() => onDone()}>Annulla</button>
        <button type="button" className="btn primary" disabled={!name.trim()} onClick={create}>Crea categoria</button>
      </div>
    </motion.div>
  );
}
