"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import type { UserProfile } from "@/lib/auth/backend";
import { browserRequest, RequestError } from "@/lib/api/browser-request";
import {
  displayDate,
  isOverdue,
  localDay,
  money,
  monthPeriod,
  parseStatement,
  parseTitles,
  paymentMethods,
  periodQuery,
  statusLabels,
  type FinancialStatement,
  type FinancialTitle,
} from "@/lib/financial/backend";
import {
  actionClass,
  Field,
  fieldClass,
  Metric,
  Modal,
  Notice,
  secondaryClass,
} from "@/components/app/module-ui";

type Kind = "receivables" | "payables";
type Dialog =
  | { type: "create" }
  | { type: "detail" | "pay"; kind: Kind; title: FinancialTitle };
const statusOptions = Object.entries(statusLabels);

export function FinancialScreen({ user }: { user: UserProfile }) {
  const canWrite = user.permissions.includes("financial.write");
  const [period, setPeriod] = useState(monthPeriod);
  const [kind, setKind] = useState<Kind>("receivables");
  const [data, setData] = useState<Record<Kind, FinancialTitle[]>>({
    receivables: [],
    payables: [],
  });
  const [errors, setErrors] = useState<
    Partial<Record<Kind | "statement", string>>
  >({});
  const [loading, setLoading] = useState(true);
  const [statementLoading, setStatementLoading] = useState(true);
  const [statement, setStatement] = useState<FinancialStatement | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("asc");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [notice, setNotice] = useState("");
  const validPeriod = Boolean(
    period.start && period.end && period.start <= period.end,
  );

  const loadTitles = useCallback(async () => {
    setLoading(true);
    await Promise.all(
      (["receivables", "payables"] as const).map(async (key) => {
        try {
          const rows = parseTitles(
            await browserRequest<unknown>(`/api/financial/${key}`),
          );
          setData((previous) => ({ ...previous, [key]: rows }));
          setErrors((previous) => ({ ...previous, [key]: undefined }));
        } catch (error) {
          setErrors((previous) => ({
            ...previous,
            [key]: (error as Error).message,
          }));
        }
      }),
    );
    setLoading(false);
  }, []);
  const loadStatement = useCallback(async () => {
    if (!period.start || !period.end || period.start > period.end) return;
    setStatementLoading(true);
    setStatement(null);
    try {
      setStatement(
        parseStatement(
          await browserRequest<unknown>(
            `/api/financial/statement?${periodQuery(period.start, period.end)}`,
          ),
        ),
      );
      setErrors((previous) => ({ ...previous, statement: undefined }));
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        statement: (error as Error).message,
      }));
    } finally {
      setStatementLoading(false);
    }
  }, [period]);
  useEffect(() => {
    void loadTitles();
  }, [loadTitles]);
  // Discard responses for a previous period, including while typing date fields.
  useEffect(() => {
    if (!validPeriod) return;
    let active = true;
    async function load() {
      setStatementLoading(true);
      setStatement(null);
      try {
        const result = parseStatement(
          await browserRequest<unknown>(
            `/api/financial/statement?${periodQuery(period.start, period.end)}`,
          ),
        );
        if (active) {
          setStatement(result);
          setErrors((previous) => ({ ...previous, statement: undefined }));
        }
      } catch (error) {
        if (active)
          setErrors((previous) => ({
            ...previous,
            statement: (error as Error).message,
          }));
      } finally {
        if (active) setStatementLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [period, validPeriod]);

  const rows = useMemo(
    () =>
      data[kind]
        .filter((title) => {
          const day = localDay(title.dueDate);
          const text =
            `${title.description} ${title.supplierName || ""}`.toLocaleLowerCase(
              "pt-BR",
            );
          const matchesStatus =
            !status ||
            (status === "Overdue" ? isOverdue(title) : title.status === status);
          return (
            validPeriod &&
            day >= period.start &&
            day <= period.end &&
            matchesStatus &&
            text.includes(search.toLocaleLowerCase("pt-BR"))
          );
        })
        .sort(
          (a, b) =>
            (sort === "asc" ? 1 : -1) *
            (Date.parse(a.dueDate) - Date.parse(b.dueDate)),
        ),
    [data, kind, period, search, sort, status, validPeriod],
  );
  const pages = Math.max(1, Math.ceil(rows.length / 15));
  const currentPage = Math.min(page, pages);
  async function saved(message: string) {
    setDialog(null);
    setNotice(message);
    await Promise.all([loadTitles(), loadStatement()]);
  }
  function updatePeriod(key: "start" | "end", value: string) {
    setPage(1);
    setPeriod((previous) => ({ ...previous, [key]: value }));
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Gestão do negócio</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Financeiro
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Acompanhe suas contas e registre recebimentos e pagamentos.
          </p>
        </div>
        {canWrite && (
          <button
            className={actionClass}
            onClick={() => setDialog({ type: "create" })}
          >
            + Nova despesa
          </button>
        )}
      </div>
      {notice && <Notice>{notice}</Notice>}
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <Field label="Vencimento inicial">
          <input
            className={fieldClass}
            type="date"
            value={period.start}
            onChange={(event) => updatePeriod("start", event.target.value)}
          />
        </Field>
        <Field label="Vencimento final">
          <input
            className={fieldClass}
            type="date"
            value={period.end}
            onChange={(event) => updatePeriod("end", event.target.value)}
          />
        </Field>
        <button
          className={secondaryClass}
          onClick={() => {
            setPeriod(monthPeriod());
            setPage(1);
          }}
        >
          Mês atual
        </button>
      </div>
      {!validPeriod && (
        <Notice error>
          Informe o início e o fim do período, com a data final igual ou
          posterior à inicial.
        </Notice>
      )}
      {validPeriod && (
        <>
          {errors.statement && (
            <Notice error>
              {errors.statement}{" "}
              <button
                className="ml-2 underline"
                onClick={() => void loadStatement()}
              >
                Tentar resumo novamente
              </button>
            </Notice>
          )}
          <div
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            aria-busy={statementLoading}
          >
            {(
              [
                ["Total a receber", "totalReceivables"],
                ["Total a pagar", "totalPayables"],
                ["Recebido", "totalPaidReceivables"],
                ["Pago", "totalPaidPayables"],
                ["Saldo previsto", "projectedBalance"],
                ["Saldo realizado", "realizedBalance"],
              ] as const
            ).map(([label, key]) => (
              <Metric
                key={key}
                label={label}
                value={
                  statementLoading
                    ? "…"
                    : statement
                      ? money(statement[key])
                      : "—"
                }
              />
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">
            Resumo por vencimento: considera os valores originais e as baixas
            acumuladas dos títulos que vencem no período, excluindo cancelados.
            Não representa movimentações pela data do pagamento. Os filtros
            abaixo afetam apenas a lista.
          </p>
        </>
      )}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex gap-2" role="group" aria-label="Tipo de conta">
            {(
              [
                ["receivables", "A receber"],
                ["payables", "A pagar"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                aria-pressed={kind === key}
                className={kind === key ? actionClass : secondaryClass}
                onClick={() => {
                  setKind(key);
                  setPage(1);
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className={secondaryClass}
            disabled={loading}
            onClick={() => {
              void loadTitles();
              void loadStatement();
            }}
          >
            Atualizar
          </button>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <Field label="Buscar descrição ou fornecedor">
            <input
              type="search"
              className={fieldClass}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar contas…"
            />
          </Field>
          <Field label="Situação">
            <select
              className={fieldClass}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ordenar vencimento">
            <select
              className={fieldClass}
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="asc">Mais antigo primeiro</option>
              <option value="desc">Mais recente primeiro</option>
            </select>
          </Field>
        </div>
        {errors[kind] ? (
          <div className="p-4">
            <Notice error>
              {errors[kind]}{" "}
              <button
                onClick={() => void loadTitles()}
                className="ml-2 underline"
              >
                Tentar novamente
              </button>
            </Notice>
          </div>
        ) : loading ? (
          <p className="p-8 text-center text-slate-500" role="status">
            Carregando contas…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            Nenhuma conta encontrada para este período e filtros.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {[
                      "Conta",
                      "Vencimento",
                      "Original",
                      "Baixado",
                      "Saldo",
                      "Situação",
                      "Ações",
                    ].map((label) => (
                      <th key={label} className="px-4 py-3 font-medium">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows
                    .slice((currentPage - 1) * 15, currentPage * 15)
                    .map((title) => (
                      <tr key={title.id} className="hover:bg-slate-50/60">
                        <td className="max-w-64 px-4 py-4">
                          <p className="font-medium">{title.description}</p>
                          {title.supplierName && (
                            <p className="mt-1 text-xs text-slate-500">
                              {title.supplierName}
                            </p>
                          )}
                          {title.quotationId && (
                            <p className="mt-1 text-xs text-slate-500">
                              Origem: orçamento
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {displayDate(title.dueDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {money(title.originalAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">
                          {money(title.paidAmount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 font-semibold">
                          {money(title.balanceDue)}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {statusLabels[title.status] || title.status}
                          </span>
                          {isOverdue(title) && title.status !== "Overdue" && (
                            <span className="mt-2 block text-xs font-medium text-red-600">
                              Em atraso
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            className="text-blue-700 underline"
                            onClick={() =>
                              setDialog({ type: "detail", kind, title })
                            }
                          >
                            Detalhes
                          </button>
                          {canWrite &&
                            title.balanceDue > 0 &&
                            title.status !== "Canceled" && (
                              <button
                                className="mt-2 block text-blue-700 underline"
                                onClick={() =>
                                  setDialog({ type: "pay", kind, title })
                                }
                              >
                                {kind === "receivables" ? "Receber" : "Pagar"}
                              </button>
                            )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 p-4 text-sm">
              <p>
                {rows.length} contas · Página {currentPage} de {pages}
              </p>
              <div className="flex gap-2">
                <button
                  className={secondaryClass}
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  Anterior
                </button>
                <button
                  className={secondaryClass}
                  disabled={currentPage >= pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {dialog?.type === "detail" && (
        <Modal title="Detalhes da conta" onClose={() => setDialog(null)}>
          <dl className="space-y-3 text-sm">
            {Object.entries({
              Descrição: dialog.title.description,
              Vencimento: displayDate(dialog.title.dueDate),
              Original: money(dialog.title.originalAmount),
              Baixado: money(dialog.title.paidAmount),
              Saldo: money(dialog.title.balanceDue),
              Situação:
                statusLabels[dialog.title.status] || dialog.title.status,
              ...(dialog.title.supplierName
                ? { Fornecedor: dialog.title.supplierName }
                : {}),
              ...(dialog.title.customerId
                ? { "Referência do cliente": dialog.title.customerId }
                : {}),
              ...(dialog.title.quotationId
                ? { "Referência do orçamento": dialog.title.quotationId }
                : {}),
            }).map(([label, value]) => (
              <div key={label}>
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-words font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="my-5 text-xs text-slate-500">
            Os valores baixados são acumulados. O histórico individual de
            pagamentos ainda não está disponível.
          </p>
          {canWrite &&
            dialog.title.balanceDue > 0 &&
            dialog.title.status !== "Canceled" && (
              <button
                className={actionClass}
                onClick={() => setDialog({ ...dialog, type: "pay" })}
              >
                Registrar{" "}
                {dialog.kind === "receivables" ? "recebimento" : "pagamento"}
              </button>
            )}
        </Modal>
      )}
      {(dialog?.type === "create" || dialog?.type === "pay") && (
        <FinancialForm
          key={dialog.type}
          dialog={dialog}
          onClose={() => {
            setDialog(null);
            void loadTitles();
            void loadStatement();
          }}
          onSaved={saved}
        />
      )}
    </section>
  );
}

function FinancialForm({
  dialog,
  onClose,
  onSaved,
}: {
  dialog: Exclude<Dialog, { type: "detail" }>;
  onClose: () => void;
  onSaved: (message: string) => Promise<void>;
}) {
  const paying = dialog.type === "pay";
  const title = paying ? dialog.title : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uncertain, setUncertain] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || uncertain) return;
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount"));
    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (title && Math.round(amount * 100) > Math.round(title.balanceDue * 100))
    ) {
      setError(
        "Informe um valor positivo que não ultrapasse o saldo disponível.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (paying)
        await browserRequest(
          `/api/financial/${dialog.kind}/${dialog.title.id}/pay`,
          "POST",
          {
            amount,
            method: Number(form.get("method")),
            paymentDate: `${form.get("date")}T12:00:00-03:00`,
            notes: String(form.get("notes") || "").trim() || null,
          },
        );
      else
        await browserRequest("/api/financial/payables", "POST", {
          supplierName: String(form.get("supplier") || "").trim(),
          description: String(form.get("description") || "").trim(),
          amount,
          dueDate: `${form.get("date")}T12:00:00-03:00`,
        });
      await onSaved(
        paying
          ? "Baixa registrada. Os saldos foram atualizados."
          : "Despesa cadastrada. Confira o período selecionado para encontrá-la.",
      );
    } catch (err) {
      setError((err as Error).message);
      setUncertain(paying && err instanceof RequestError && err.status >= 500);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={
        paying
          ? `Registrar ${dialog.kind === "receivables" ? "recebimento" : "pagamento"}`
          : "Nova despesa"
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={submit} className="space-y-4">
        {title && (
          <Notice>
            {title.description}
            <br />
            Saldo disponível: <strong>{money(title.balanceDue)}</strong>. É
            possível registrar parte do saldo.
          </Notice>
        )}
        {!paying && (
          <>
            <Field label="Fornecedor">
              <input
                className={fieldClass}
                name="supplier"
                required
                maxLength={200}
              />
            </Field>
            <Field label="Descrição">
              <input
                className={fieldClass}
                name="description"
                required
                maxLength={500}
              />
            </Field>
          </>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Valor (R$)">
            <input
              autoFocus
              className={fieldClass}
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={title?.balanceDue}
              required
              defaultValue={title?.balanceDue.toFixed(2)}
            />
          </Field>
          <Field label={paying ? "Data da baixa" : "Vencimento"}>
            <input
              className={fieldClass}
              name="date"
              type="date"
              required
              defaultValue={localDay()}
            />
          </Field>
        </div>
        {paying && (
          <>
            <Field label="Forma de pagamento">
              <select className={fieldClass} name="method">
                {paymentMethods.map((method, index) => (
                  <option key={method} value={index}>
                    {method}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Observação (opcional)">
              <textarea
                className={fieldClass}
                name="notes"
                maxLength={1000}
                rows={3}
              />
            </Field>
          </>
        )}
        {error && (
          <Notice error>
            {error} Se houve falha de conexão, atualize a lista antes de repetir
            uma baixa.
          </Notice>
        )}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className={secondaryClass}
            disabled={busy}
            onClick={onClose}
          >
            {uncertain ? "Fechar e conferir a lista" : "Cancelar"}
          </button>
          <button className={actionClass} disabled={busy || uncertain}>
            {busy
              ? "Salvando…"
              : paying
                ? "Confirmar baixa"
                : "Cadastrar despesa"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
