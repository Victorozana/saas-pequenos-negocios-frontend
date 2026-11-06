"use client";

import { useEffect, useState } from "react";
import { Field, Notice, fieldClass, secondaryClass } from "@/components/app/module-ui";
import { WorkOrderScheduleForm } from "./work-order-schedule-form";
import { agendaTimeZone, fromAgendaInput } from "@/lib/appointments/time";
import type { components } from "@/lib/api/generated/schema";
import type { ScheduleParticipant, ScheduledWorkOrder, WorkOrderPage } from "@/lib/work-orders/backend";

export function WorkOrderList({ canManage, refresh, onSaved, quotationId }: {
  canManage: boolean;
  refresh: number;
  onSaved: () => void;
  quotationId?: string;
}) {
  const [people, setPeople] = useState<ScheduleParticipant[]>([]);
  const [orders, setOrders] = useState<WorkOrderPage | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [participant, setParticipant] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [editing, setEditing] = useState<ScheduledWorkOrder | null>(null);

  useEffect(() => {
    if (!canManage) return;
    const controller = new AbortController();
    fetch("/api/work-orders/participants", { signal: controller.signal })
      .then(async (response) => { if (response.ok) setPeople(await response.json()); })
      .catch(() => {});
    return () => controller.abort();
  }, [canManage]);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ page: String(page), pageSize: "10" });
    if (quotationId) query.set("quotationId", quotationId);
    if (participant) query.set("participantId", participant);
    if (status) query.set("status", status);
    if (date) {
      const followingDay = new Date(new Date(date + "T00:00Z").getTime() + 86400000).toISOString().slice(0, 10);
      query.set("start", fromAgendaInput(date + "T00:00"));
      query.set("end", fromAgendaInput(followingDay + "T00:00"));
    }
    fetch("/api/work-orders?" + query, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 403 ? "Você não tem acesso às ordens de serviço." : "Não foi possível carregar as ordens de serviço.");
        setOrders(await response.json());
        setError("");
      }).catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [date, page, participant, quotationId, refresh, status]);

  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">Ordens de serviço</h2>
      <div className="grid gap-2 sm:grid-cols-3">
        {canManage && <Field label="Funcionário">
          <select className={fieldClass} value={participant} onChange={(e) => { setParticipant(e.target.value); setPage(1); }}>
            <option value="">Todos</option>
            {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </Field>}
        <Field label="Data">
          <input type="date" className={fieldClass} value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} />
        </Field>
        <Field label="Situação">
          <select className={fieldClass} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">Todas</option><option value="Scheduled">Agendada</option><option value="InProgress">Em execução</option>
            <option value="WaitingForMaterial">Aguardando material</option><option value="Completed">Concluída</option><option value="Cancelled">Cancelada</option>
          </select>
        </Field>
      </div>
      {error && <Notice error>{error}</Notice>}
      {!orders && !error && <p role="status">Carregando ordens de serviço…</p>}
      {orders?.items.length === 0 && !error && <p>Nenhuma ordem de serviço encontrada.</p>}
      {orders?.items.map((order) => {
        const visit = order.visit as components["schemas"]["ScheduledVisit"] | null;
        return <article key={order.id} className="grid gap-1 rounded-xl border bg-white p-4 text-sm">
          <strong>{order.code}</strong>
          <p>{order.participants.map((person) => person.name + (person.isActive ? "" : " (inativo)")).join(", ") || "Sem equipe"}</p>
          {visit && <p>{new Date(visit.startTime).toLocaleString("pt-BR", { timeZone: agendaTimeZone })} · {visit.address}</p>}
          {canManage && order.needsRegularization && <p className="font-medium text-amber-800">Regularização necessária</p>}
          {canManage && !["Completed", "Cancelled"].includes(order.status) &&
            <button className={secondaryClass + " justify-self-start"} onClick={() => setEditing(order)}>Editar programação</button>}
        </article>;
      })}
      {orders && orders.total > orders.pageSize && (
        <div className="flex items-center gap-3">
          <button className={secondaryClass} disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page}</span>
          <button className={secondaryClass} disabled={page * orders.pageSize >= orders.total} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      )}
      {editing && <WorkOrderScheduleForm editing endpoint={"/api/work-orders/" + editing.id + "/schedule"}
        visit={editing.visit as components["schemas"]["ScheduledVisit"] | null}
        selected={editing.participants.filter((person) => person.isActive).map((person) => person.id)}
        onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onSaved(); }} />}
    </section>
  );
}
