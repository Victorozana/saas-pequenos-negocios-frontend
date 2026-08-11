import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings2,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import type { UserProfile } from "@/lib/auth/backend";
import { MODULES, hasPermission } from "@/lib/auth/permissions";

const moduleIcons = {
  dashboard: LayoutDashboard,
  customers: UsersRound,
  services: BriefcaseBusiness,
  sales: FileText,
  appointments: CalendarDays,
  financial: WalletCards,
  team: Settings2,
} as const;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppShell({
  user,
  children,
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  const visibleModules = MODULES.filter(
    (module) =>
      !module.permission || hasPermission(user.permissions, module.permission),
  );

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-950 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex h-18 items-center gap-3 px-5 lg:h-20 lg:px-6">
          <div className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-md shadow-blue-600/20">
            N
          </div>
          <div>
            <p className="font-semibold tracking-tight">Nexo Local</p>
            <p className="text-xs text-slate-400">Gestão do seu negócio</p>
          </div>
        </div>

        <nav
          aria-label="Navegação principal"
          className="flex gap-2 overflow-x-auto px-4 pb-4 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0"
        >
          {visibleModules.map((module) => {
            const Icon = moduleIcons[module.id as keyof typeof moduleIcons];

            if (!module.available) {
              return (
                <div
                  className="flex min-w-45 items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 lg:min-w-0"
                  key={module.id}
                >
                  <Icon className="size-4" />
                  <span className="flex-1 text-sm font-medium">{module.label}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Em breve
                  </span>
                </div>
              );
            }

            return (
              <Link
                className="flex min-w-40 items-center gap-3 rounded-xl bg-blue-50 px-3 py-2.5 text-blue-700 lg:min-w-0"
                href={module.href}
                key={module.id}
              >
                <Icon className="size-4" />
                <span className="text-sm font-semibold">{module.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-slate-100 p-3 lg:block">
          <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5">
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur lg:h-20 lg:px-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Ambiente de trabalho
            </p>
            <p className="mt-0.5 text-sm font-semibold text-slate-700">
              {user.role}
            </p>
          </div>
          <div className="flex items-center gap-3 lg:hidden">
            <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white">
              {initials(user.name)}
            </div>
            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-5 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
