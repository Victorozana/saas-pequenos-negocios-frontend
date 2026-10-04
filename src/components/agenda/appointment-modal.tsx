"use client";

import { X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AppointmentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export function AppointmentModal({ isOpen, onClose, onSaved }: AppointmentModalProps) {
  const [type, setType] = useState("1"); // 1=TechnicalVisit
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [workOrderId, setWorkOrderId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!startTime || !endTime) {
      setError("Preencha a data de início e término.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const payload = {
        type: parseInt(type, 10),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        address: address || undefined,
        notes: notes || undefined,
        workOrderId: workOrderId || undefined,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Não foi possível criar o agendamento.");
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro inesperado.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Novo Agendamento
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Tipo de Compromisso</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="1">Visita Técnica</option>
              <option value="2">Medição</option>
              <option value="3">Instalação</option>
              <option value="4">Outro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Início</label>
              <Input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Término</label>
              <Input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Endereço (opcional)</label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, número, bairro..."
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">ID da OS Vinculada (opcional)</label>
            <Input
              value={workOrderId}
              onChange={(e) => setWorkOrderId(e.target.value)}
              placeholder="Ex: 123e4567-e89b-12d3..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Observações</label>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Salvando..." : "Salvar Agendamento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
