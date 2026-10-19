import { useState, type FormEvent } from "react";
import { TrashIcon } from "@phosphor-icons/react";
import { deleteGoal, saveGoal, useStore } from "../state/store";
import type { Goal } from "../model/types";
import { Modal, Seg } from "./ui";
import { CategoryPicker } from "./CategoryPicker";

export function GoalDialog() {
  const draft = useStore((s) => s.goalDialog);
  const close = () => useStore.setState({ goalDialog: null });
  return (
    <Modal open={!!draft} onClose={close}>
      {draft && <GoalForm id={draft.id} onClose={close} />}
    </Modal>
  );
}

function GoalForm({ id, onClose }: { id?: string; onClose: () => void }) {
  const categories = useStore((s) => s.categories);
  const existing = useStore((s) => s.goals.find((g) => g.id === id));
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? categories[0].id);
  const [kind, setKind] = useState<Goal["kind"]>(existing?.kind ?? "sessions");
  // minutes goals are edited in hours
  const [target, setTarget] = useState(existing ? (existing.kind === "minutes" ? existing.target / 60 : existing.target) : 3);
  const [why, setWhy] = useState(existing?.why ?? "");

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = Math.max(kind === "sessions" ? 1 : 0.5, target || 1);
    saveGoal({ id: existing?.id, categoryId, kind, target: kind === "minutes" ? Math.round(value * 60) : Math.round(value), why: why.trim() });
    onClose();
  };

  return (
    <form onSubmit={submit}>
      <div className="dialog-body">
        <h2 className="serif" style={{ fontSize: 34, lineHeight: 1.15, color: "var(--strong)" }}>
          {existing ? "Modifica obiettivo" : "Nuovo obiettivo"}
        </h2>

        <CategoryPicker value={categoryId} onChange={setCategoryId} />

        <div className="field">
          <span className="label">Ogni settimana voglio fare</span>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              className="input mono"
              type="number"
              min={kind === "sessions" ? 1 : 0.5}
              step={kind === "sessions" ? 1 : 0.5}
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              style={{ width: 90 }}
            />
            <Seg value={kind} options={[["sessions", "sessioni"], ["minutes", "ore"]]} onChange={setKind} />
          </div>
          <span className="hint">Meglio un obiettivo che raggiungi quasi sempre che uno ambizioso che ti scoraggia.</span>
        </div>

        <div className="field">
          <label htmlFor="why">Perché è importante per te</label>
          <textarea id="why" className="input" rows={3} value={why} onChange={(e) => setWhy(e.target.value)} placeholder="es. «Voglio arrivare all'esame tranquillo»" />
          <span className="hint">Lo rivedrai nei giorni in cui non ne hai voglia.</span>
        </div>
      </div>
      <div className="dialog-foot">
        {existing && (
          <button type="button" className="btn danger" onClick={() => { deleteGoal(existing.id); onClose(); }}>
            <TrashIcon size={14} weight="bold" /> Elimina
          </button>
        )}
        <span className="grow" />
        <button type="button" className="btn quiet" onClick={onClose}>Annulla</button>
        <button type="submit" className="btn primary">{existing ? "Salva" : "Aggiungi"}</button>
      </div>
    </form>
  );
}
