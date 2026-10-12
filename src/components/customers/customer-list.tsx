"use client";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Phone,
  Search,
  User,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Customer, type PaginatedCustomers } from "@/lib/customers/backend";

interface CustomerListProps {
  onEditCustomer: (customer: Customer) => void;
  onNewCustomer: () => void;
  refreshTrigger?: number;
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

function formatDocument(type: string | null, value: string | null): string {
  if (!value) return "Não informado";
  if (value.includes("*")) return value;
  const digits = value.replace(/\D/g, "");

  if (type === "CPF" || digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (type === "CNPJ" || digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value;
}

export function CustomerList({
  onEditCustomer,
  onNewCustomer,
  refreshTrigger = 0,
}: CustomerListProps) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaginatedCustomers | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearch.trim()) queryParams.set("search", debouncedSearch.trim());
        queryParams.set("page", page.toString());
        queryParams.set("pageSize", "10");

        const response = await fetch(`/api/customers?${queryParams.toString()}`);
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            window.location.href = "/login";
            return;
          }
          const body = await response.json().catch(() => ({}));
          if (isMounted) {
            setError(
              typeof body.message === "string"
                ? body.message
                : "Não foi possível carregar a lista de clientes agora. Tente novamente.",
            );
          }
          return;
        }

        const resData = await response.json();
        if (isMounted) {
          setData(resData.customers);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError("Não foi possível carregar a lista de clientes agora. Tente novamente.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, page, refreshTrigger]);

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      {/* Top Bar: Search & Action CTA */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por nome, documento ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200"
          />
        </div>

        <Button
          onClick={onNewCustomer}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          <UserPlus className="size-4" /> Novo Cliente
        </Button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div
          role="status"
          aria-label="Carregando lista de clientes"
          className="space-y-3"
        >
          {[1, 2, 3, 4].map((id) => (
            <div
              key={id}
              className="h-16 animate-pulse rounded-2xl border border-slate-200 bg-slate-100/80 p-4"
            />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <User className="size-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">
            Nenhum cliente encontrado
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {debouncedSearch
              ? `Nenhum resultado corresponde à busca "${debouncedSearch}".`
              : "Comece cadastrando seu primeiro cliente para vincular a orçamentos e agendamentos."}
          </p>
          <Button
            onClick={onNewCustomer}
            variant="outline"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border-slate-300 bg-white text-slate-700"
          >
            <UserPlus className="size-4 text-blue-600" /> Cadastrar Primeiro Cliente
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Cliente / Nome
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Documento
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Contato
                  </th>
                  <th scope="col" className="px-5 py-3.5 font-semibold">
                    Localidade
                  </th>
                  <th scope="col" className="px-5 py-3.5 text-right font-semibold">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((customer) => {
                  const cleanPhone = customer.phone.replace(/\D/g, "");
                  const waUrl = cleanPhone
                    ? `https://wa.me/55${cleanPhone}`
                    : null;

                  return (
                    <tr
                      key={customer.id}
                      className="transition-colors hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 font-semibold">
                            {customer.documentType === "CNPJ" ? (
                              <Building2 className="size-4 text-blue-600" />
                            ) : (
                              <User className="size-4 text-slate-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-950">
                              {customer.name}
                            </div>
                            {customer.email && (
                              <div className="text-xs text-slate-400">
                                {customer.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          <span className="font-semibold text-slate-500">
                            {customer.documentType || "DOC"}:
                          </span>
                          {formatDocument(customer.documentType, customer.documentValue)}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Phone className="size-3.5 text-slate-400" />
                          {waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-blue-600 hover:underline"
                            >
                              {formatPhone(customer.phone)}
                            </a>
                          ) : (
                            <span>{formatPhone(customer.phone)}</span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-500">
                        {customer.city || customer.state ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-slate-400" />
                            <span>
                              {[customer.city, customer.state]
                                .filter(Boolean)
                                .join(" / ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Não informado</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEditCustomer(customer)}
                          className="inline-flex items-center gap-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="size-3.5" /> Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              <div>
                Página {data.page} de {totalPages} ({data.totalCount} clientes)
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg px-2.5"
                >
                  <ChevronLeft className="size-3.5" /> Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg px-2.5"
                >
                  Próxima <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
