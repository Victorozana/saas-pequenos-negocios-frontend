import type { components } from "@/lib/api/generated/schema";
export type TeamMember = components["schemas"]["TeamMemberResponse"];
export type TeamInvitation = components["schemas"]["TeamInvitationResponse"];
export function isAdministrator(role: string) {
  return ["admin", "owner_admin"].includes(role.toLowerCase());
}
export function roleLabel(role: string) {
  return role.toLowerCase() === "owner_admin"
    ? "Administrador proprietário"
    : role.toLowerCase() === "admin"
      ? "Administrador"
      : role;
}
export function parseMembers(data: unknown): TeamMember[] {
  if (
    !Array.isArray(data) ||
    !data.every(
      (m) =>
        m &&
        typeof m.userId === "string" &&
        typeof m.name === "string" &&
        typeof m.email === "string" &&
        typeof m.role === "string" &&
        typeof m.isActive === "boolean" &&
        typeof m.status === "string" &&
        Array.isArray(m.permissions) &&
        m.permissions.every((p: unknown) => typeof p === "string"),
    )
  )
    throw new Error("O serviço retornou membros em formato inválido.");
  return data as TeamMember[];
}
