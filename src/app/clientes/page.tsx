"use client";

import { ShieldCheck, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app/app-shell";
import { CustomerFormModal } from "@/components/customers/customer-form-modal";
import { CustomerList } from "@/components/customers/customer-list";
import { type Customer } from "@/lib/customers/backend";
import { type UserProfile } from "@/lib/auth/backend";

export default function ClientesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
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
    setCustomerToEdit(null);
    setIsModalOpen(true);
  }

  function handleOpenEdit(customer: Customer) {
    setCustomerToEdit(customer);
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
              <Users className="size-3.5" /> Clientes
            </div>
            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-slate-950">
              Gestão de Clientes
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre e gerencie a carteira de clientes final (Pessoa Física e Jurídica).
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 sm:self-auto">
            <ShieldCheck className="size-4 text-emerald-600" />
            {user.role}
          </div>
        </div>

        <CustomerList
          onEditCustomer={handleOpenEdit}
          onNewCustomer={handleOpenNew}
          refreshTrigger={refreshTrigger}
        />

        <CustomerFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSaved={handleSaved}
          customerToEdit={customerToEdit}
        />
      </section>
    </AppShell>
  );
}
