"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/auth/backend";
import { browserRequest } from "@/lib/api/browser-request";
import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  isAdministrator,
  parseMembers,
  roleLabel,
  type TeamInvitation,
  type TeamMember,
} from "@/lib/team/backend";
import {
  actionClass,
  Field,
  fieldClass,
  Metric,
  Modal,
  Notice,
  secondaryClass,
} from "@/components/app/module-ui";
import { displayDate } from "@/lib/financial/backend";

const permissionGroups = [
  ["Clientes", "customers"],
  ["Serviços", "services"],
  ["Orçamentos e ordens", "sales"],
  ["Financeiro", "financial"],
  ["Agenda", "appointments"],
  ["Equipe", "team"],
] as const;
const permissionNames: Record<string, string> = {
  read: "Consultar",
  write: "Criar e editar",
  delete: "Excluir",
};
type Dialog =
  | { type: "invite" }
  | { type: "edit" | "status"; member: TeamMember };

export function TeamScreen({ user }: { user: UserProfile }) {
  const router = useRouter();
  const canWrite = user.permissions.includes("team.write");
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMembers(
        parseMembers(await browserRequest<unknown>("/api/team-members")),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    browserRequest<unknown>("/api/team-members")
      .then((data) => {
        if (active) setMembers(parseMembers(data));
      })
      .catch((err) => {
        if (active) setError((err as Error).message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function saved(message: string, ownAccess = false) {
    setDialog(null);
    setNotice(message);
    if (ownAccess) {
      try {
        await browserRequest("/api/auth/session");
      } catch {
        /* Session handling redirects on 401. */
      }
      router.refresh();
    }
    await load();
  }
  const rows = members.filter(
    (member) =>
      `${member.name} ${member.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")) &&
      (!role || member.role === role) &&
      (!status || (status === "active" ? member.isActive : !member.isActive)),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 15));
  const currentPage = Math.min(page, pages);
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-600">Pessoas e acessos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Equipe</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gerencie quem participa do negócio e o que cada pessoa pode acessar.
          </p>
        </div>
        {canWrite && (
          <button
            className={actionClass}
            onClick={() => setDialog({ type: "invite" })}
          >
            + Convidar pessoa
          </button>
        )}
      </div>
      {notice && <Notice>{notice}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Membros"
          value={loading || error ? "—" : members.length}
        />
        <Metric
          label="Vínculos ativos"
          value={
            loading || error ? "—" : members.filter((m) => m.isActive).length
          }
        />
        <Metric
          label="Vínculos inativos"
          value={
            loading || error ? "—" : members.filter((m) => !m.isActive).length
          }
        />
        <Metric
          label="Administradores ativos"
          value={
            loading || error
              ? "—"
              : members.filter(
                  (m) =>
                    m.isActive &&
                    m.status === "Active" &&
                    isAdministrator(m.role),
                ).length
          }
        />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="grid items-end gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]">
          <Field label="Nome ou e-mail">
            <input
              type="search"
              className={fieldClass}
              placeholder="Buscar pessoa…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </Field>
          <Field label="Papel">
            <select
              className={fieldClass}
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              {Array.from(new Set(members.map((m) => m.role))).map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Vínculo">
            <select
              className={fieldClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Todos</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
          </Field>
          <button
            className={secondaryClass}
            disabled={loading}
            onClick={() => void load()}
          >
            Atualizar
          </button>
        </div>
        {error ? (
          <div className="p-4">
            <Notice error>
              {error}{" "}
              <button className="ml-2 underline" onClick={() => void load()}>
                Tentar novamente
              </button>
            </Notice>
          </div>
        ) : loading ? (
          <p role="status" className="p-8 text-center text-slate-500">
            Carregando equipe…
          </p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-slate-500">
            Nenhum membro encontrado para os filtros selecionados.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    {["Pessoa", "Papel", "Situação", "Acessos", "Ações"].map(
                      (label) => (
                        <th className="px-4 py-3 font-medium" key={label}>
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows
                    .slice((currentPage - 1) * 15, currentPage * 15)
                    .map((member) => (
                      <tr key={member.userId}>
                        <td className="px-4 py-4">
                          <p className="font-medium">
                            {member.name}
                            {member.userId === user.id && (
                              <span className="ml-2 text-xs text-blue-600">
                                Você
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {member.email}
                          </p>
                          {member.isLegalRepresentative && (
                            <p className="mt-1 text-xs text-blue-600">
                              Representante legal
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">{roleLabel(member.role)}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${member.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {member.isActive
                              ? "Vínculo ativo"
                              : "Vínculo inativo"}
                          </span>
                          {member.isActive && member.status !== "Active" && (
                            <p className="mt-2 text-xs text-amber-700">
                              Conta:{" "}
                              {member.status === "PendingEmailVerification"
                                ? "E-mail pendente"
                                : member.status}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {isAdministrator(member.role)
                            ? "Acesso completo"
                            : `${member.permissions.length} permissões`}
                        </td>
                        <td className="px-4 py-4">
                          {canWrite ? (
                            <div className="flex flex-wrap gap-3">
                              <button
                                className="text-blue-700 underline"
                                onClick={() =>
                                  setDialog({ type: "edit", member })
                                }
                              >
                                Editar acesso
                              </button>
                              <button
                                className={
                                  member.isActive
                                    ? "text-red-700 underline"
                                    : "text-blue-700 underline"
                                }
                                onClick={() =>
                                  setDialog({ type: "status", member })
                                }
                              >
                                {member.isActive ? "Desativar" : "Ativar"}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              Somente leitura
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 p-4 text-sm">
              <p>
                {rows.length} membros · Página {currentPage} de {pages}
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
      <p className="text-xs text-slate-500">
        Convites ficam separados dos membros até serem aceitos. A listagem e o
        reenvio de convites ainda não estão disponíveis.
      </p>
      {dialog && (
        <TeamForm
          key={dialog.type}
          dialog={dialog}
          userId={user.id}
          onClose={() => setDialog(null)}
          onSaved={saved}
        />
      )}
    </section>
  );
}

function TeamForm({
  dialog,
  userId,
  onClose,
  onSaved,
}: {
  dialog: Dialog;
  userId: string;
  onClose: () => void;
  onSaved: (message: string, ownAccess?: boolean) => Promise<void>;
}) {
  const member = dialog.type === "invite" ? null : dialog.member;
  const ownAccess = member?.userId === userId;
  const [role, setRole] = useState(member?.role || "Colaborador");
  const [permissions, setPermissions] = useState<string[]>(
    member?.permissions || ["appointments.read"],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const administrative = isAdministrator(role);
  const roles = Array.from(
    new Set(["Colaborador", "Admin", ...(member ? [member.role] : [])]),
  );
  function toggle(permission: string, checked: boolean) {
    const [module, operation] = permission.split(".");
    setPermissions((previous) => {
      const selected = new Set(previous);
      if (checked) {
        selected.add(permission);
        if (operation !== "read") selected.add(`${module}.read`);
      } else {
        selected.delete(permission);
        if (operation === "read") {
          selected.delete(`${module}.write`);
          selected.delete(`${module}.delete`);
        }
      }
      return [...selected];
    });
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const access = {
      role,
      permissions: administrative ? Object.values(PERMISSIONS) : permissions,
    };
    try {
      if (dialog.type === "invite") {
        const result = await browserRequest<TeamInvitation>(
          "/api/team-members/invitations",
          "POST",
          { ...access, email: String(form.get("email") || "").trim() },
        );
        await onSaved(
          `Convite registrado para envio a ${result.email}. Válido até ${displayDate(result.expiresAtUtc)}. O envio de e-mail depende do provedor configurado.`,
        );
      } else if (dialog.type === "status") {
        await browserRequest(
          `/api/team-members/${dialog.member.userId}/status`,
          "PATCH",
          { isActive: !dialog.member.isActive },
        );
        await onSaved(
          `Vínculo ${dialog.member.isActive ? "desativado" : "ativado"}.`,
          ownAccess,
        );
      } else {
        await browserRequest(
          `/api/team-members/${dialog.member.userId}`,
          "PUT",
          access,
        );
        await onSaved("Acesso atualizado.", ownAccess);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  const title =
    dialog.type === "invite"
      ? "Convidar pessoa"
      : dialog.type === "edit"
        ? "Editar acesso"
        : `${member?.isActive ? "Desativar" : "Ativar"} vínculo`;
  return (
    <Modal title={title} onClose={onClose} busy={busy}>
      <form onSubmit={submit} className="space-y-4">
        {member && (
          <p className="text-sm text-slate-600">
            <strong>{member.name}</strong>
            <br />
            {member.email}
          </p>
        )}
        {ownAccess && (
          <Notice>
            Você está alterando o próprio acesso. A mudança pode encerrar sua
            sessão ou retirar o acesso a este módulo.
          </Notice>
        )}
        {dialog.type === "status" ? (
          <p className="text-sm text-slate-600">
            {member?.isActive
              ? "A pessoa perderá acesso a este negócio. O cadastro e os dados históricos serão preservados."
              : "O vínculo voltará a ficar ativo com as permissões já configuradas."}{" "}
            A equipe deve manter pelo menos um administrador ativo.
          </p>
        ) : (
          <>
            {dialog.type === "invite" && (
              <>
                <Field label="E-mail da pessoa">
                  <input
                    autoFocus
                    name="email"
                    className={fieldClass}
                    type="email"
                    maxLength={254}
                    required
                    autoComplete="off"
                  />
                </Field>
                <Notice>
                  O convite vale por 7 dias. O envio depende da configuração de
                  e-mail do ambiente; registrar o convite não confirma sua
                  entrega.
                </Notice>
              </>
            )}
            <Field label="Papel">
              <select
                className={fieldClass}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((value) => (
                  <option key={value} value={value}>
                    {roleLabel(value)}
                  </option>
                ))}
              </select>
            </Field>
            {administrative && (
              <Notice>
                Administradores recebem todas as permissões automaticamente.
              </Notice>
            )}
            <fieldset disabled={administrative || busy} className="space-y-3">
              <legend className="mb-2 text-sm font-semibold">
                Permissões por módulo
              </legend>
              {permissionGroups.map(([label, prefix]) => (
                <div
                  key={prefix}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="mb-2 text-sm font-medium">{label}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-2">
                    {Object.values(PERMISSIONS)
                      .filter((p) => p.startsWith(`${prefix}.`))
                      .map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center gap-2 text-sm"
                        >
                          <input
                            type="checkbox"
                            className="size-4 accent-blue-600"
                            checked={
                              administrative || permissions.includes(permission)
                            }
                            onChange={(e) =>
                              toggle(permission, e.target.checked)
                            }
                          />
                          {permissionNames[permission.split(".")[1]]}
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </fieldset>
            <p className="text-xs text-slate-500">
              Ações de escrita incluem a leitura do módulo. Retirar a leitura
              também retira as ações dependentes.
            </p>
          </>
        )}
        {error && <Notice error>{error}</Notice>}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={busy}
            className={secondaryClass}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button disabled={busy} className={actionClass}>
            {busy
              ? "Salvando…"
              : dialog.type === "invite"
                ? "Registrar convite"
                : "Confirmar alteração"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
