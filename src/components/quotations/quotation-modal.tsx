"use client";

import { LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PaginatedCustomers } from "@/lib/customers/backend";
import type { CreateQuotationPayload } from "@/lib/quotations/backend";

interface QuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type QuotationItemForm = {
  serviceName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  discountAmount: number;
};

export function QuotationModal({ isOpen, onClose, onSaved }: QuotationModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [validUntil, setValidUntil] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 15); // Default to 15 days
    return date.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  
  const [items, setItems] = useState<QuotationItemForm[]>([
    { serviceName: "", unit: "Unidade", unitPrice: 0, quantity: 1, discountAmount: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    
    // Fetch customers for the dropdown
    async function loadCustomers() {
      try {
        const response = await fetch("/api/customers?pageSize=100");
        if (response.ok) {
          const data: { customers: PaginatedCustomers } = await response.json();
          setCustomers(data.customers.items.map(c => ({ id: c.id, name: c.name })));
        }
      } catch (err) {
        console.error("Failed to load customers", err);
      } finally {
        setLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, [isOpen]);

  if (!isOpen) return null;

  const addItem = () => {
    setItems([
      ...items,
      { serviceName: "", unit: "Unidade", unitPrice: 0, quantity: 1, discountAmount: 0 }
    ]);
  };

  const updateItem = (index: number, field: keyof QuotationItemForm, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((acc, item) => {
    const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
    const total = subtotal - (item.discountAmount || 0);
    return acc + Math.max(0, total);
  }, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }

    if (!validUntil) {
      setError("Informe a validade do orçamento.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione ao menos um item de serviço.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.serviceName.trim()) {
        setError(`O nome do serviço no item ${i + 1} é obrigatório.`);
        return;
      }
      if (item.quantity <= 0) {
        setError(`A quantidade do item ${i + 1} deve ser maior que zero.`);
        return;
      }
      if (item.unitPrice < 0) {
        setError(`O valor unitário do item ${i + 1} não pode ser negativo.`);
        return;
      }
      if (item.discountAmount < 0) {
        setError(`O desconto do item ${i + 1} não pode ser negativo.`);
        return;
      }
      if (item.discountAmount > (item.quantity * item.unitPrice)) {
        setError(`O desconto do item ${i + 1} não pode ser maior que o subtotal.`);
        return;
      }
    }

    setLoading(true);
    try {
      const payload: CreateQuotationPayload = {
        customerId,
        validUntil: new Date(validUntil).toISOString(),
        notes: notes.trim() || undefined,
        items: items.map(item => ({
          serviceName: item.serviceName.trim(),
          unit: item.unit.trim(),
          unitPrice: Number(item.unitPrice),
          quantity: Number(item.quantity),
          discountAmount: Number(item.discountAmount),
        })),
      };

      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          window.location.href = "/login";
          return;
        }
        const body = await response.json().catch(() => ({}));
        setError(
          typeof body.message === "string"
            ? body.message
            : "Não foi possível criar o orçamento agora. Tente novamente.",
        );
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Não foi possível criar o orçamento agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>

        <h2 id="modal-title" className="text-xl font-bold text-slate-950">
          Novo Orçamento
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Preencha os serviços e valores para gerar a proposta.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer-select" className="block text-xs font-medium text-slate-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                id="customer-select"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                disabled={loadingCustomers}
              >
                <option value="">Selecione um cliente</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="valid-until" className="block text-xs font-medium text-slate-700 mb-1">
                Validade da Proposta <span className="text-red-500">*</span>
              </label>
              <Input
                id="valid-until"
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">Itens do Orçamento</h3>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
                const total = subtotal - (item.discountAmount || 0);

                return (
                  <div key={index} className="relative rounded-xl border border-slate-200 bg-slate-50 p-4 pb-5">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-red-600"
                        title="Remover item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mt-1">
                      <div className="sm:col-span-12">
                        <label htmlFor={`serviceName-${index}`} className="block text-xs font-medium text-slate-700 mb-1">
                          Serviço <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id={`serviceName-${index}`}
                          placeholder="Ex: Instalação de Bancada"
                          value={item.serviceName}
                          onChange={(e) => updateItem(index, "serviceName", e.target.value)}
                          className="bg-white"
                        />
                      </div>
                      
                      <div className="sm:col-span-3">
                        <label htmlFor={`quantity-${index}`} className="block text-xs font-medium text-slate-700 mb-1">
                          Quantidade <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 0)}
                          className="bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`unit-${index}`} className="block text-xs font-medium text-slate-700 mb-1">
                          Unidade <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id={`unit-${index}`}
                          placeholder="Ex: Metros, Unidade"
                          value={item.unit}
                          onChange={(e) => updateItem(index, "unit", e.target.value)}
                          className="bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`unitPrice-${index}`} className="block text-xs font-medium text-slate-700 mb-1">
                          Preço Unit. (R$) <span className="text-red-500">*</span>
                        </label>
                        <Input
                          id={`unitPrice-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          className="bg-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor={`discountAmount-${index}`} className="block text-xs font-medium text-slate-700 mb-1">
                          Desconto (R$)
                        </label>
                        <Input
                          id={`discountAmount-${index}`}
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.discountAmount}
                          onChange={(e) => updateItem(index, "discountAmount", parseFloat(e.target.value) || 0)}
                          className="bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-3 text-right text-sm font-medium text-slate-700 bg-white inline-block px-3 py-1.5 rounded-lg border border-slate-200 float-right">
                      Subtotal: <span className="text-blue-700">{formatCurrency(total)}</span>
                    </div>
                    <div className="clear-both"></div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="mt-4 w-full border-dashed border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-blue-600"
            >
              <Plus className="size-4 mr-2" /> Adicionar Item de Serviço
            </Button>
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-medium text-slate-700 mb-1">
              Observações (Visível no PDF)
            </label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Prazos, condições de pagamento, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 pt-5">
            <div className="text-sm text-slate-500">
              Valor Total Estimado: <br />
              <span className="text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl border-slate-300"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Gerando…
                  </>
                ) : (
                  "Gerar Orçamento"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
