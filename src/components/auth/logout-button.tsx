"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function logout() {
    setIsLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/login");
    router.refresh();
  }

  return (
    <Button
      aria-label="Sair da conta"
      className="h-9 w-full justify-start gap-2 rounded-lg px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
      disabled={isLeaving}
      onClick={logout}
      variant="ghost"
    >
      <LogOut /> {isLeaving ? "Saindo…" : "Sair da conta"}
    </Button>
  );
}
