"use client";

import { CalendarPlus2, Clock3, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import type { TodayAppointment } from "@/lib/appointments/backend";

type AgendaState =
  | { kind: "loading" }
  | { kind: "ready"; appointments: TodayAppointment[] }
  | { kind: "error" };

const SAFE_ERROR_MESSAGE =
  "Não foi possível carregar sua agenda agora. Tente novamente.";

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AgendaSkeleton() {
  return (
    <div aria-label="Carregando agenda…" className="space-y-3" role="status">
      <span className="sr-only">Carregando agenda…</span>
      {[0, 1, 2].map((item) => (
        <div
          className="h-21 animate-pulse rounded-xl bg-slate-100"
          key={item}
        />
      ))}
    </div>
  );
}

export function AgendaToday() {
  const { replace, refresh } = useRouter();
  const [state, setState] = useState<AgendaState>({ kind: "loading" });

  useEffect(() => {
    let active = true;

    async function loadAgenda() {
      try {
        const response = await fetch("/api/dashboard/today", {
          cache: "no-store",
        });

        if (response.status === 401) {
          replace("/login");
          refresh();
          return;
        }

        if (!response.ok) throw new Error("Agenda request failed");

        const body: unknown = await response.json();
        if (
          !body ||
          typeof body !== "object" ||
          !Array.isArray((body as { appointments?: unknown }).appointments)
        ) {
          throw new Error("Invalid agenda payload");
        }

        if (active) {
          setState({
            kind: "ready",
            appointments: (body as { appointments: TodayAppointment[] }).appointments
              .slice()
              .sort(
                (first, second) =>
                  new Date(first.startTime).getTime() -
                  new Date(second.startTime).getTime(),
              ),
          });
        }
      } catch {
        if (active) setState({ kind: "error" });
      }
    }

    void loadAgenda();
    return () => {
      active = false;
    };
  }, [refresh, replace]);

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/40 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-950">Agenda de hoje</p>
          <p className="mt-1 text-sm text-slate-500">
            Seus atendimentos atribuídos para hoje.
          </p>
        </div>
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Clock3 className="size-5" />
        </div>
      </div>

      <div className="mt-6">
        {state.kind === "loading" && <AgendaSkeleton />}

        {state.kind === "error" && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
            {SAFE_ERROR_MESSAGE}
          </div>
        )}

        {state.kind === "ready" && state.appointments.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
            <CalendarPlus2 className="mx-auto size-6 text-slate-400" />
            <p className="mt-3 font-medium text-slate-800">
              Nenhum agendamento para hoje
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Quando a criação estiver disponível, você poderá iniciar por aqui.
            </p>
            <Button className="mt-5" disabled type="button">
              Criar primeiro agendamento
            </Button>
          </div>
        )}

        {state.kind === "ready" && state.appointments.length > 0 && (
          <ol className="space-y-3">
            {state.appointments.map((appointment) => (
              <li
                className="flex gap-4 rounded-xl border border-slate-100 p-4"
                key={appointment.id}
              >
                <p className="w-24 shrink-0 text-sm font-semibold text-slate-950">
                  {formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
                </p>
                <div className="min-w-0">
                  <p className="font-medium text-slate-800">{appointment.type}</p>
                  {appointment.address && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{appointment.address}</span>
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
