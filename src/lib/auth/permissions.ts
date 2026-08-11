export const PERMISSIONS = {
  customersRead: "customers.read",
  customersWrite: "customers.write",
  customersDelete: "customers.delete",
  servicesRead: "services.read",
  servicesWrite: "services.write",
  salesRead: "sales.read",
  salesWrite: "sales.write",
  financialRead: "financial.read",
  financialWrite: "financial.write",
  appointmentsRead: "appointments.read",
  appointmentsWrite: "appointments.write",
  teamRead: "team.read",
  teamWrite: "team.write",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export type AppModule = {
  id: string;
  label: string;
  description: string;
  href: string;
  permission?: Permission;
  available: boolean;
};

export const MODULES: readonly AppModule[] = [
  {
    id: "dashboard",
    label: "Visão geral",
    description: "Resumo da operação",
    href: "/dashboard",
    available: true,
  },
  {
    id: "customers",
    label: "Clientes",
    description: "Cadastro e histórico",
    href: "/clientes",
    permission: PERMISSIONS.customersRead,
    available: false,
  },
  {
    id: "services",
    label: "Serviços",
    description: "Catálogo e preços",
    href: "/servicos",
    permission: PERMISSIONS.servicesRead,
    available: false,
  },
  {
    id: "sales",
    label: "Orçamentos",
    description: "Propostas e ordens",
    href: "/orcamentos",
    permission: PERMISSIONS.salesRead,
    available: false,
  },
  {
    id: "appointments",
    label: "Agenda",
    description: "Compromissos da equipe",
    href: "/agenda",
    permission: PERMISSIONS.appointmentsRead,
    available: false,
  },
  {
    id: "financial",
    label: "Financeiro",
    description: "Receitas e pagamentos",
    href: "/financeiro",
    permission: PERMISSIONS.financialRead,
    available: false,
  },
  {
    id: "team",
    label: "Equipe",
    description: "Pessoas e permissões",
    href: "/equipe",
    permission: PERMISSIONS.teamRead,
    available: false,
  },
] as const;

export function hasPermission(
  permissions: readonly string[],
  permission: Permission,
): boolean {
  return permissions.includes(permission);
}

export function canAccessModule(
  module: AppModule,
  permissions: readonly string[],
): boolean {
  return (
    module.available &&
    (!module.permission || hasPermission(permissions, module.permission))
  );
}

