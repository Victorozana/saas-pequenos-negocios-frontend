import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { TeamScreen } from "@/components/team/team-screen";
import { getSessionUser } from "@/lib/auth/server-session";
export default async function EquipePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/equipe");
  return (
    <AppShell user={user}>
      {user.permissions.includes("team.read") ? (
        <TeamScreen user={user} />
      ) : (
        <section>
          <h1 className="text-2xl font-semibold">Equipe</h1>
          <p className="mt-4 text-slate-600">
            Você não tem permissão para consultar a equipe. Solicite acesso ao
            administrador.
          </p>
        </section>
      )}
    </AppShell>
  );
}
