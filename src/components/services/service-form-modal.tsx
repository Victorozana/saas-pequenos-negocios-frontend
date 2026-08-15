"use client";

import { LoaderCircle, Wrench, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ServiceItem } from "@/lib/services/backend";

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  serviceToEdit?: ServiceItem | null;
}

const COMMON_UNITS = ["m²", "m", "hora", "unidade", "diária", "kg", "ponto"];

function ServiceFormContent({
  onClose,
  onSaved,
  serviceToEdit = null,
}: Omit<ServiceFormModalProps, "isOpen">) {
  const [name, setName] = useState(serviceToEdit?.name || "");
  const [description, setDescription] = useState(serviceToEdit?.description || "");
  const [unit, setUnit] = useState(serviceToEdit?.unit || "m²");
  const [customUnit, setCustomUnit] = useState("");
  const [basePrice, setBasePrice] = useState(
    serviceToEdit?.basePrice !== undefined ? serviceToEdit.basePrice.toString() : "",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedUnit = unit === "outro" ? customUnit.trim() : unit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome do serviço.");
      return;
    }

    if (!selectedUnit) {
      setError("Informe a unidade de medida.");
      return;
    }

    const priceNum = parseFloat(basePrice.replace(",", "."));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError("Informe um preço base maior que zero.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        unit: selectedUnit,
        basePrice: priceNum,
      };

      const isEdit = Boolean(serviceToEdit);
      const url = isEdit
        ? `/api/services/${serviceToEdit?.id}`
        : "/api/services";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
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
            : "Não foi possível salvar o serviço agora. Tente novamente.",
        );
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Não foi possível salvar o serviço agora. Tente novamente.");
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
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-semibold">
            <Wrench className="size-5" />
          </div>
          <div>
            <h2 id="modal-title" className="text-xl font-bold text-slate-950">
              {serviceToEdit ? "Editar Serviço" : "Novo Serviço"}
            </h2>
            <p className="text-xs text-slate-500">
              Cadastre e precifique os serviços oferecidos pela sua empresa.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Nome do Serviço */}
          <div>
            <label htmlFor="service-name" className="block text-xs font-medium text-slate-700 mb-1">
              Nome do Serviço <span className="text-red-500">*</span>
            </label>
            <Input
              id="service-name"
              type="text"
              required
              placeholder="Ex: Corte de Mármore, Meia Esquadria, Instalação"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="service-description" className="block text-xs font-medium text-slate-700 mb-1">
              Descrição (opcional)
            </label>
            <Input
              id="service-description"
              type="text"
              placeholder="Ex: Preço de corte por metro quadrado com acabamento básico"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Unidade de Medida */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Unidade de Medida <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {COMMON_UNITS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => {
                    setUnit(u);
                    setCustomUnit("");
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    unit === u
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {u}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setUnit("outro")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  unit === "outro"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Outro
              </button>
            </div>

            {unit === "outro" && (
              <Input
                placeholder="Informe a unidade personalizada (ex: pacote, kit)"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                className="mt-2"
              />
            )}
          </div>

          {/* Preço Base (R$) */}
          <div>
            <label htmlFor="service-price" className="block text-xs font-medium text-slate-700 mb-1">
              Preço Base (R$) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                R$
              </span>
              <Input
                id="service-price"
                type="text"
                required
                placeholder="0,00"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
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
                  <LoaderCircle className="size-4 animate-spin" /> Salvando…
                </>
              ) : (
                "Salvar Serviço"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ServiceFormModal(props: ServiceFormModalProps) {
  if (!props.isOpen) return null;

  return (
    <ServiceFormContent
      key={props.serviceToEdit ? props.serviceToEdit.id : "new"}
      {...props}
    />
  );
}
