"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Phone,
  Calendar,
  Upload,
  Megaphone,
  UserPlus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Group = {
  label: string;
  items: Array<{
    href: string;
    label: string;
    icon: typeof LayoutDashboard;
  }>;
};

const groups: Group[] = [
  {
    label: "Operação",
    items: [
      { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
      { href: "/dashboard/ligacoes", label: "Ligações", icon: Phone },
      { href: "/dashboard/agendamentos", label: "Agendamentos", icon: Calendar },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { href: "/dashboard/leads", label: "Leads", icon: Users },
      { href: "/dashboard/leads/novo", label: "Adicionar lead", icon: UserPlus },
      { href: "/dashboard/leads/upload", label: "Importar planilha", icon: Upload },
    ],
  },
  {
    label: "Configuração",
    items: [
      { href: "/dashboard/agente", label: "Meu agente", icon: Sparkles },
      { href: "/dashboard/campanhas", label: "Campanhas", icon: Megaphone },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    // exact match wins
    if (pathname === href) return true;
    // descendant match only if no sibling has the longer prefix
    return groups.every((g) =>
      g.items.every((i) => i.href === href || !pathname.startsWith(i.href))
    )
      ? pathname.startsWith(href + "/")
      : pathname.startsWith(href + "/") && pathname !== href;
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1.5 px-3 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              // Custom active matching: prefer exact match per group; for leads/upload and
              // leads/novo we want them to win over /dashboard/leads.
              const exact = pathname === item.href;
              const childOfThis = pathname.startsWith(item.href + "/");
              // If another sibling has more specific prefix matching, that wins
              const moreSpecific = groups.some((g) =>
                g.items.some((i2) => i2.href !== item.href && pathname.startsWith(i2.href))
              );
              const active = exact || (childOfThis && !moreSpecific);

              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1 w-1 rounded-full bg-[oklch(0.85_0.15_75)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
