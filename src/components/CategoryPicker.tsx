import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { PencilSimpleIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import { addCategory, deleteCategory, updateCategory, useStore } from "../state/store";
import { COLORS } from "../model/categories";
import type { Category, ColorKey, IconKey } from "../model/types";
import { confirmDialog } from "../platform";
import { CategoryIcon, ICON_KEYS, ease, iconLabel, tone } from "./ui";

const COLOR_LABELS: Record<ColorKey, string> = {
  rose: "Rosa", lavender: "Lavanda", sky: "Azzurro", mint: "Menta", butter: "Giallo", peach: "Pesca",
};

/** Category chips plus an inline form to create a category (which then gets selected) or edit the selected one. */
export function CategoryPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const categories = useStore((s) => s.categories);
  const [form, setForm] = useState<"new" | "edit" | null>(null);
  const selected = categories.find((c) => c.id === value);

  return (
    <div className="field">
      <span className="label">Categoria</span>
      <div className="chips">
        {categories.map((c) => (
          <button type="button" key={c.id} className={"chip " + (c.id === value ? "on " + tone(c) : "")} onClick={() => onChange(c.id)}>
            <CategoryIcon icon={c.icon} size={14} /> {c.name}
          </button>
        ))}
        {!form && (
          <>
            <button type="button" className="chip add" onClick={() => setForm("new")}>
              <PlusIcon size={14} weight="bold" /> Nuova
            </button>
            {selected && (
              <button type="button" className="chip add" onClick={() => setForm("edit")} title={`Modifica «${selected.name}»`}>
                <PencilSimpleIcon size={14} weight="bold" /> Modifica
              </button>
            )}
          </>
        )}
      </div>
      <AnimatePresence initial={false}>
        {form && (
          <CategoryForm
            key={form}
            editing={form === "edit" ? selected : undefined}
            onDone={(id) => {
              setForm(null);
              if (id) onChange(id);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Creates a category, or edits/deletes `editing`. `onDone` gets the category to select, if it changed. */
function CategoryForm({ editing, onDone }: { editing?: Category; onDone: (id?: string) => void }) {
  const categories = useStore((s) => s.categories);
  const tasksCount = useStore((s) => (editing ? s.tasks.filter((t) => t.categoryId === editing.id).length : 0));
  const goalsCount = useStore((s) => (editing ? s.goals.filter((g) => g.categoryId === editing.id).length : 0));
  const [name, setName] = useState(editing?.name ?? "");
  // a new category starts from a color no category uses yet
  const [color, setColor] = useState<ColorKey>(
    () => editing?.color ?? COLORS.find((c) => !categories.some((x) => x.color === c)) ?? COLORS[categories.length % COLORS.length],
  );
  const [icon, setIcon] = useState<IconKey>(editing?.icon ?? "sparkle");

  const save = () => {
    const n = name.trim();
    if (!n) return;
    if (editing) {
      updateCategory(editing.id, { name: n, color, icon });
      onDone();
    } else onDone(addCategory({ name: n, color, icon }));
  };

  const remove = async () => {
    if (!editing) return;
    const consequences = [
      tasksCount && `${tasksCount === 1 ? "La sua attività resta" : `Le sue ${tasksCount} attività restano`} sotto «Altro».`,
      goalsCount && `${goalsCount === 1 ? "Il suo obiettivo viene eliminato" : `I suoi ${goalsCount} obiettivi vengono eliminati`}.`,
    ].filter(Boolean).join(" ");
    if (!(await confirmDialog(`Eliminare la categoria «${editing.name}»? ${consequences}`.trim(), "Elimina"))) return;
    deleteCategory(editing.id);
    onDone(categories.find((c) => c.id !== editing.id)!.id);
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
            if (e.key === "Enter") { e.preventDefault(); save(); }
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
        {editing && categories.length > 1 && (
          <button type="button" className="btn danger" onClick={remove}>
            <TrashIcon size={14} weight="bold" /> Elimina
          </button>
        )}
        <span className="grow" />
        <button type="button" className="btn quiet" onClick={() => onDone()}>Annulla</button>
        <button type="button" className="btn primary" disabled={!name.trim()} onClick={save}>{editing ? "Salva" : "Crea categoria"}</button>
      </div>
    </motion.div>
  );
}
