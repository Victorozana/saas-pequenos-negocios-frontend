"use client";

import { CalendarDays, Plus, MapPin, BriefcaseBusiness } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { type UserProfile } from "@/lib/auth/backend";
import { AppointmentModal } from "@/components/agenda/appointment-modal";

type Appointment = {
  id: string;
  type: string;
  startTime: string;
  endTime: string;
  address?: string;
  workOrderId?: string;
};

const APPOINTMENT_TYPES: Record<string, string> = {
  TechnicalVisit: "Visita Técnica",
  Measurement: "Medição",
  Installation: "Instalação",
  Other: "Outro"
};

export default function AgendaPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    async function checkSession() {
      try {
        const response = await fetch("/api/auth/session");
        if (!response.ok) {
          router.replace("/login");
          return;
        }
        const data = await response.json();
        if (isMounted) setUser(data.user);
      } catch {
        router.replace("/login");
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }
    checkSession();
    return () => { isMounted = false; };
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    async function loadAppointments() {
      if (!user) return;
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error("Failed to load appointments");
        const data = await res.json();
        if (isMounted) setAppointments(data);
      } catch {
        if (isMounted) setError("Não foi possível carregar a agenda.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadAppointments();
    return () => { isMounted = false; };
  }, [user, refreshTrigger]);

  const handleSaved = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppShell user={user}>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Agenda Operacional</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe e gerencie visitas, medições e instalações.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="size-4" /> Novo Agendamento
        </Button>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 p-4" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <CalendarDays className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">Nenhum agendamento encontrado</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Você não possui compromissos agendados. Crie um novo agendamento para começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const start = new Date(apt.startTime);
            const end = new Date(apt.endTime);
            const typeLabel = APPOINTMENT_TYPES[apt.type] || apt.type;

            return (
              <div key={apt.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      {typeLabel}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {start.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">
                    {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 sm:items-end">
                  {apt.workOrderId && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <BriefcaseBusiness className="size-4" />
                      OS Vinculada
                    </div>
                  )}
                  {apt.address && (
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="size-4" />
                      {apt.address}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </AppShell>
  );
}
