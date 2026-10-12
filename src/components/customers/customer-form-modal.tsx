"use client";

import { Building2, LoaderCircle, User, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Customer } from "@/lib/customers/backend";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  customerToEdit?: Customer | null;
}

function CustomerFormContent({
  onClose,
  onSaved,
  customerToEdit = null,
}: Omit<CustomerFormModalProps, "isOpen">) {
  const [docType, setDocType] = useState<"CPF" | "CNPJ">(
    customerToEdit?.documentType === "CNPJ" ? "CNPJ" : "CPF",
  );
  const [name, setName] = useState(customerToEdit?.name || "");
  const [phone, setPhone] = useState(customerToEdit?.phone || "");
  const [email, setEmail] = useState(customerToEdit?.email || "");
  const [documentValue, setDocumentValue] = useState(customerToEdit?.documentValue || "");
  const [street, setStreet] = useState(customerToEdit?.street || "");
  const [number, setNumber] = useState(customerToEdit?.number || "");
  const [complement, setComplement] = useState(customerToEdit?.complement || "");
  const [neighborhood, setNeighborhood] = useState(customerToEdit?.neighborhood || "");
  const [city, setCity] = useState(customerToEdit?.city || "");
  const [state, setState] = useState(customerToEdit?.state || "");
  const [zipCode, setZipCode] = useState(customerToEdit?.zipCode || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Informe o nome do cliente.");
      return;
    }

    if (!phone.trim()) {
      setError("Informe o telefone de contato.");
      return;
    }

    const preserveDocument = Boolean(customerToEdit && docType === customerToEdit.documentType &&
      documentValue === customerToEdit.documentValue && documentValue.includes("*"));
    const cleanDoc = preserveDocument ? "" : documentValue.replace(/\D/g, "");
    if (cleanDoc) {
      if (docType === "CPF" && cleanDoc.length !== 11) {
        setError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
        return;
      }
      if (docType === "CNPJ" && cleanDoc.length !== 14) {
        setError("Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || null,
        documentType: cleanDoc ? docType : null,
        documentValue: cleanDoc || null,
        street: street.trim() || null,
        number: number.trim() || null,
        complement: complement.trim() || null,
        neighborhood: neighborhood.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        zipCode: zipCode.trim() || null,
      };

      const isEdit = Boolean(customerToEdit);
      const url = isEdit
        ? `/api/customers/${customerToEdit?.id}`
        : "/api/customers";
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit ? { ...payload, customerId: customerToEdit?.id, ...(preserveDocument ? { preserveDocument: true } : {}) } : payload,
        ),
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
            : "Não foi possível salvar o cliente agora. Tente novamente.",
        );
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Não foi possível salvar o cliente agora. Tente novamente.");
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
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <button
          onClick={onClose}
          type="button"
          aria-label="Fechar modal"
          className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>

        <h2 id="modal-title" className="text-xl font-bold text-slate-950">
          {customerToEdit ? "Editar Cliente" : "Novo Cliente"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Preencha os dados do cliente para cadastro na carteira.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Tipo de Pessoa */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Tipo de Pessoa
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDocType("CPF")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  docType === "CPF"
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 font-semibold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <User className="size-4" /> Pessoa Física (CPF)
              </button>
              <button
                type="button"
                onClick={() => setDocType("CNPJ")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-medium transition-all ${
                  docType === "CNPJ"
                    ? "border-blue-600 bg-blue-50/50 text-blue-700 font-semibold"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Building2 className="size-4" /> Pessoa Jurídica (CNPJ)
              </button>
            </div>
          </div>

          {/* Nome / Razão Social */}
          <div>
            <label htmlFor="customer-name" className="block text-xs font-medium text-slate-700 mb-1">
              Nome Completo ou Razão Social <span className="text-red-500">*</span>
            </label>
            <Input
              id="customer-name"
              type="text"
              required
              placeholder={
                docType === "CPF" ? "Ex: Maria dos Santos" : "Ex: Padaria Central LTDA"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Documento & Contatos */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="customer-doc" className="block text-xs font-medium text-slate-700 mb-1">
                {docType === "CPF" ? "CPF (11 dígitos)" : "CNPJ (14 dígitos)"}
              </label>
              <Input
                id="customer-doc"
                type="text"
                placeholder={docType === "CPF" ? "000.000.000-00" : "00.000.000/0001-00"}
                value={documentValue}
                onChange={(e) => setDocumentValue(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-phone" className="block text-xs font-medium text-slate-700 mb-1">
                Telefone / WhatsApp <span className="text-red-500">*</span>
              </label>
              <Input
                id="customer-phone"
                type="text"
                required
                placeholder="(11) 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="customer-email" className="block text-xs font-medium text-slate-700 mb-1">
              E-mail (opcional)
            </label>
            <Input
              id="customer-email"
              type="email"
              placeholder="cliente@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Endereço */}
          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Endereço de Atendimento / Entrega (Opcional)
            </h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Rua / Logradouro"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Input
                placeholder="CEP"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
              />
              <Input
                placeholder="Complemento (ex: Sala 10)"
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
              />
              <Input
                placeholder="Bairro"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Input
                  placeholder="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div>
                <Input
                  placeholder="UF (ex: SP)"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
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
                "Salvar Cliente"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CustomerFormModal(props: CustomerFormModalProps) {
  if (!props.isOpen) return null;

  return (
    <CustomerFormContent
      key={props.customerToEdit ? props.customerToEdit.id : "new"}
      {...props}
    />
  );
}
