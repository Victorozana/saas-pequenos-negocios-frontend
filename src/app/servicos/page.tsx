"use client";

import { ShieldCheck, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { ServiceFormModal } from "@/components/services/service-form-modal";
import { ServiceList } from "@/components/services/service-list";
import { type ServiceItem } from "@/lib/services/backend";
import { type UserProfile } from "@/lib/auth/backend";

export default function ServicosPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
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
        if (isMounted) {
          setUser(data.user);
        }
      } catch {
        router.replace("/login");
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    checkSession();
    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loadingUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400">
        Carregando...
      </div>
    );
  }

  if (!user) return null;

  function handleOpenNew() {
    setServiceToEdit(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(service: ServiceItem) {
    setServiceToEdit(service);
    setIsModalOpen(true);
  }

  function handleSaved() {
    setRefreshTrigger((prev) => prev + 1);
  }

  return (
    <AppShell user={user}>
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <Wrench className="size-3.5" /> Catálogo
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Catálogo de Serviços
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre e gerencie a tabela de preços base dos serviços oferecidos.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 sm:self-auto">
            <ShieldCheck className="size-4 text-emerald-600" />
            {user.role}
          </div>
        </div>

        <ServiceList
          onEditService={handleOpenEdit}
          onNewService={handleOpenNew}
          refreshTrigger={refreshTrigger}
        />

        <ServiceFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
          serviceToEdit={serviceToEdit}
        />
      </section>
    </AppShell>
  );
}
