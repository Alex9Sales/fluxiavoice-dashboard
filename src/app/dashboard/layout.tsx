import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarNav } from "@/components/sidebar-nav";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark, BrandWord, LiveDot } from "@/components/brand";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const initials = (session.user.name || "F")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const firstName = session.user.name?.split(" ")[0] || "Franqueado";

  return (
    <div className="min-h-screen flex bg-background">
      {/* ============================== Sidebar ============================== */}
      <aside className="w-[260px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pt-6 pb-5 border-b border-sidebar-border">
          <BrandMark size="sm" />
          <div className="flex-1 min-w-0">
            <BrandWord size="sm" className="text-foreground" />
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mt-0.5">
              Painel · v1
            </p>
          </div>
        </div>

        {/* Marina status — signature touch */}
        <div className="mx-3 mt-4 rounded-xl border border-border/60 bg-card/60 p-3">
          <div className="flex items-center gap-2.5">
            <LiveDot tone="emerald" />
            <p className="text-sm font-medium">Marina</p>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              online
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            Pronta pra ligar · seg–sex 9h–18h
          </p>
        </div>

        <SidebarNav />

        {/* Footer — account */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-foreground text-background font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{firstName}</p>
              <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
            </div>
            <ThemeToggle />
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-1"
          >
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </form>
        </div>
      </aside>

      {/* ============================== Main ============================== */}
      <main className="flex-1 overflow-y-auto">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
