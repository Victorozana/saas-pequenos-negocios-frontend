"use client";

import { FileText, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { QuotationList } from "@/components/quotations/quotation-list";
import { QuotationModal } from "@/components/quotations/quotation-modal";
import { type UserProfile } from "@/lib/auth/backend";

export default function OrcamentosPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
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

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

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
      <section className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <FileText className="size-3.5" /> Orçamentos
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Gestão de Orçamentos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie propostas comerciais, orçamentos emitidos e exportação em PDF.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 sm:self-auto">
            <ShieldCheck className="size-4 text-emerald-600" />
            {user.role}
          </div>
        </div>

        <QuotationList
          onNewQuotation={handleOpenModal}
          refreshTrigger={refreshTrigger}
        />

        <QuotationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSaved={handleSaved}
        />
      </section>
    </AppShell>
  );
}
