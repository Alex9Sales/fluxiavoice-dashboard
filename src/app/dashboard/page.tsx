import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { LiveDot, SoundLine } from "@/components/brand";
import { Users, Phone, Calendar, TrendingUp, ArrowUpRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default async function DashboardHome() {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);
  const firstName = session?.user.name?.split(" ")[0] || "você";

  const campanhaIds = (
    await prisma.campanha.findMany({
      where: { franqueadoId },
      select: { id: true },
    })
  ).map((c) => c.id);

  const [totalLeads, leadsPendentes, leadsAgendados, totalLigacoes, totalAgendamentos] = await Promise.all([
    prisma.lead.count({ where: { campanhaId: { in: campanhaIds } } }),
    prisma.lead.count({ where: { campanhaId: { in: campanhaIds }, status: "pendente" } }),
    prisma.lead.count({ where: { campanhaId: { in: campanhaIds }, status: "agendado" } }),
    prisma.ligacao.count({ where: { lead: { campanhaId: { in: campanhaIds } } } }),
    prisma.agendamento.count({ where: { lead: { campanhaId: { in: campanhaIds } } } }),
  ]);

  const taxaConversao = totalLeads > 0 ? Math.round((leadsAgendados / totalLeads) * 100) : 0;

  const ultimasLigacoes = await prisma.ligacao.findMany({
    where: { lead: { campanhaId: { in: campanhaIds } } },
    include: { lead: { select: { nome: true, telefone: true } } },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-14 max-w-7xl space-y-12">
      {/* ===== HERO ===== */}
      <header className="stagger-1 relative">
        <div className="flex items-center gap-3 mb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1">
            <LiveDot tone="emerald" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Marina pronta
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Hoje · {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>

        <h1 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95] tracking-[-0.025em] max-w-4xl">
          {greeting}, {firstName}. <br />
          <span className="italic text-muted-foreground">Sua agenda começa</span>{" "}
          <span className="text-foreground">aqui.</span>
        </h1>

        <div className="mt-6 flex items-end gap-6">
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            Sua IA ligou, conversou e marcou. Aqui está o resultado da última operação.
          </p>
          <SoundLine bars={28} className="ml-auto hidden h-8 w-56 text-foreground/15 md:block" />
        </div>
      </header>

      {/* ===== KPI GRID ===== */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          className="stagger-2"
          icon={<Users className="h-5 w-5" strokeWidth={1.5} />}
          label="Leads no funil"
          value={totalLeads}
          tone="indigo"
          hint={`${leadsPendentes} aguardando ligação`}
        />
        <MetricCard
          className="stagger-3"
          icon={<Phone className="h-5 w-5" strokeWidth={1.5} />}
          label="Ligações feitas"
          value={totalLigacoes}
          tone="violet"
          hint={`média ${totalLigacoes > 0 ? "~3 min" : "—"}`}
        />
        <MetricCard
          className="stagger-4"
          icon={<Calendar className="h-5 w-5" strokeWidth={1.5} />}
          label="Reuniões"
          value={totalAgendamentos}
          tone="emerald"
          hint="confirmadas"
        />
        <MetricCard
          className="stagger-5"
          icon={<TrendingUp className="h-5 w-5" strokeWidth={1.5} />}
          label="Conversão"
          value={`${taxaConversao}%`}
          tone="amber"
          hint="agendados / total"
        />
      </section>

      {/* ===== Activity ===== */}
      <section className="stagger-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Últimas ligações */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Atividade · em tempo real
              </p>
              <h2 className="font-display text-2xl tracking-tight mt-1">Últimas ligações</h2>
            </div>
            <Link
              href="/dashboard/ligacoes"
              className="group inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todas
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <Card className="overflow-hidden border-border/60">
            {ultimasLigacoes.length === 0 ? (
              <EmptyCalls />
            ) : (
              <div className="divide-y divide-border/60">
                {ultimasLigacoes.map((lig, i) => (
                  <CallRow
                    key={lig.id}
                    nome={lig.lead?.nome || "—"}
                    telefone={lig.lead?.telefone || ""}
                    resultado={lig.resultado}
                    duracao={lig.duracaoSegundos}
                    quando={lig.createdAt}
                    delayMs={i * 30}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick actions */}
        <aside className="space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Atalhos
          </p>
          <QuickActionCard
            href="/dashboard/leads/novo"
            title="Adicionar contato"
            description="Cadastra um lead avulso na hora"
            emoji="📇"
          />
          <QuickActionCard
            href="/dashboard/leads/upload"
            title="Importar planilha CIT"
            description="Sobe Excel com vários leads"
            emoji="📊"
          />
          <QuickActionCard
            href="/dashboard/agendamentos"
            title="Ver agendamentos"
            description="Reuniões marcadas pela Marina"
            emoji="🗓️"
          />
        </aside>
      </section>
    </div>
  );
}

/* ============================== METRIC CARD ============================== */
function MetricCard({
  icon,
  label,
  value,
  hint,
  tone,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  tone: "indigo" | "violet" | "emerald" | "amber";
  className?: string;
}) {
  const tones = {
    indigo:
      "from-[oklch(0.55_0.22_275/0.12)] to-transparent text-[oklch(0.5_0.22_275)] dark:text-[oklch(0.78_0.16_275)]",
    violet:
      "from-[oklch(0.6_0.2_320/0.12)] to-transparent text-[oklch(0.55_0.2_320)] dark:text-[oklch(0.78_0.16_320)]",
    emerald:
      "from-[oklch(0.62_0.18_165/0.12)] to-transparent text-[oklch(0.55_0.18_165)] dark:text-[oklch(0.78_0.14_165)]",
    amber:
      "from-[oklch(0.8_0.15_70/0.15)] to-transparent text-[oklch(0.6_0.18_60)] dark:text-[oklch(0.85_0.16_75)]",
  };
  return (
    <Card
      className={`group relative overflow-hidden border-border/60 lift ${className || ""}`}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${tones[tone].split(" ").slice(0, 2).join(" ")}`}
      />
      <CardContent className="relative p-5">
        <div className={`flex items-center justify-between ${tones[tone].split(" ").slice(2).join(" ")}`}>
          {icon}
          <Sparkles className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60" />
        </div>
        <div className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {label}
          </p>
          <p className="font-display text-4xl tracking-[-0.02em] mt-1.5 leading-none">{value}</p>
          {hint && (
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ============================== CALL ROW ============================== */
function CallRow({
  nome,
  telefone,
  resultado,
  duracao,
  quando,
  delayMs,
}: {
  nome: string;
  telefone: string;
  resultado: string | null;
  duracao: number | null;
  quando: Date | null;
  delayMs: number;
}) {
  const time = quando
    ? new Date(quando).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div
      className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
      style={{ animation: `stagger-fade 0.4s ease-out ${delayMs}ms both` }}
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{nome}</p>
        <p className="font-mono text-[11px] text-muted-foreground truncate">{telefone}</p>
      </div>
      <div className="text-right">
        <ResultadoBadge resultado={resultado} />
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          {time} · {formatDuration(duracao)}
        </p>
      </div>
    </div>
  );
}

function formatDuration(s: number | null) {
  if (!s) return "—";
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}m ${String(ss).padStart(2, "0")}s`;
}

function ResultadoBadge({ resultado }: { resultado: string | null }) {
  const map: Record<string, { label: string; cls: string }> = {
    agendar: { label: "Agendou", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30" },
    interesse: { label: "Interesse", cls: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30" },
    sem_interesse: { label: "Sem interesse", cls: "bg-muted text-muted-foreground ring-1 ring-border" },
    callback: { label: "Retorno", cls: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30" },
    voicemail: { label: "Caixa postal", cls: "bg-muted text-muted-foreground ring-1 ring-border" },
    no_answer: { label: "Não atendeu", cls: "bg-muted text-muted-foreground ring-1 ring-border" },
  };
  const item = map[resultado || ""] || { label: resultado || "—", cls: "bg-muted text-muted-foreground ring-1 ring-border" };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${item.cls}`}>
      {item.label}
    </span>
  );
}

/* ============================== QUICK ACTION ============================== */
function QuickActionCard({
  href,
  title,
  description,
  emoji,
}: {
  href: string;
  title: string;
  description: string;
  emoji: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-xl border border-border/60 bg-card p-4 lift"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}

/* ============================== EMPTY ============================== */
function EmptyCalls() {
  return (
    <div className="px-5 py-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Phone className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-xl tracking-tight">Silêncio por enquanto.</p>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
        Importe leads em <strong className="text-foreground">Importar planilha</strong> e ative o
        disparador. Em minutos, a Marina liga.
      </p>
      <div className="mt-5 flex items-center justify-center gap-2">
        <Link
          href="/dashboard/leads/upload"
          className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90"
        >
          Importar planilha
        </Link>
        <Link
          href="/dashboard/leads/novo"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent"
        >
          Adicionar contato
        </Link>
      </div>
    </div>
  );
}
