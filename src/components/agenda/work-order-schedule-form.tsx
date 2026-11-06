"use client";

import { useEffect, useRef, useState } from "react";
import { actionClass, Field, fieldClass, Modal, Notice } from "@/components/app/module-ui";
import { asAgendaInput, appointmentTypes, fromAgendaInput } from "@/lib/appointments/time";
import type { components } from "@/lib/api/generated/schema";
import type { ScheduleParticipant, ScheduleWorkOrderRequest } from "@/lib/work-orders/backend";

type Props = {
  endpoint: string;
  visit?: components["schemas"]["ScheduledVisit"] | null;
  selected?: string[];
  editing?: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function WorkOrderScheduleForm({ endpoint, visit, selected = [], editing, onClose, onSaved }: Props) {
  const [people, setPeople] = useState<ScheduleParticipant[] | null>(null);
  const [participants, setParticipants] = useState(selected);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submission = useRef<{ body: string; key: string } | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/work-orders/participants", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Não foi possível consultar os funcionários ativos.");
        setPeople(await response.json());
      })
      .catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!people || submitting.current) return;
    const data = new FormData(event.currentTarget);
    const participantIds = participants.filter((id) => people.some((person) => person.id === id)).sort();
    if (!participantIds.length) {
      setError("Selecione pelo menos um funcionário ativo.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const payload: ScheduleWorkOrderRequest = {
        type: Number(data.get("type")),
        startTime: fromAgendaInput(String(data.get("startTime"))),
        endTime: fromAgendaInput(String(data.get("endTime"))),
        participantIds,
        address: String(data.get("address")).trim() || null,
        notes: String(data.get("notes")).trim() || null,
      };
      if (payload.endTime <= payload.startTime) throw new Error("O horário final deve ser posterior ao inicial.");
      const body = JSON.stringify(payload);
      if (!submission.current || submission.current.body !== body)
        submission.current = { body, key: crypto.randomUUID() };
      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": submission.current.key },
        body,
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.message || "Não foi possível salvar a ordem de serviço.");
      }
      onSaved();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível salvar a ordem de serviço.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? "Editar programação da OS" : "Criar ordem de serviço"} onClose={onClose} busy={busy}>
      <form onSubmit={save} className="grid gap-4">
        {error && <Notice error>{error}</Notice>}
        <Field label="Atividade">
          <select name="type" className={fieldClass} defaultValue={visit?.type ?? 1}>
            {Object.values(appointmentTypes).map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Início (São Paulo)">
            <input name="startTime" type="datetime-local" required className={fieldClass} defaultValue={visit ? asAgendaInput(visit.startTime) : ""} />
          </Field>
          <Field label="Término (São Paulo)">
            <input name="endTime" type="datetime-local" required className={fieldClass} defaultValue={visit ? asAgendaInput(visit.endTime) : ""} />
          </Field>
        </div>
        <fieldset className="grid gap-2" disabled={busy}>
          <legend className="text-sm font-medium">Equipe responsável</legend>
          {people === null && !error && <p role="status">Carregando equipe…</p>}
          {people?.length === 0 && <p>Nenhum funcionário ativo disponível.</p>}
          {people?.map((person) => (
            <label key={person.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={participants.includes(person.id)} onChange={(event) => {
                const checked = event.currentTarget.checked;
                setParticipants((current) => checked ? [...current, person.id] : current.filter((id) => id !== person.id));
              }} />
              {person.name}
            </label>
          ))}
        </fieldset>
        <Field label="Endereço">
          <input name="address" maxLength={255} className={fieldClass} defaultValue={visit?.address ?? ""} />
        </Field>
        <Field label="Observações">
          <textarea name="notes" maxLength={1000} className={fieldClass} defaultValue={visit?.notes ?? ""} />
        </Field>
        <button type="submit" disabled={busy || !people?.length} className={actionClass}>
          {busy ? "Salvando…" : editing ? "Salvar programação" : "Criar e agendar OS"}
        </button>
      </form>
    </Modal>
  );
}
