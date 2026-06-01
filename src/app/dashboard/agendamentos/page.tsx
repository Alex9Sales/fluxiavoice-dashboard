import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Calendar, ExternalLink, Clock, MapPin, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  confirmado: { label: "Confirmado", cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30" },
  cancelado:  { label: "Cancelado",  cls: "bg-destructive/12 text-destructive ring-1 ring-destructive/30" },
  realizado:  { label: "Realizado",  cls: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30" },
  no_show:    { label: "No-show",    cls: "bg-muted text-muted-foreground ring-1 ring-border" },
};

export default async function AgendamentosPage() {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const agendamentos = await prisma.agendamento.findMany({
    where: { lead: { campanha: { franqueadoId } } },
    include: {
      lead: { select: { id: true, nome: true, telefone: true, grauProximidade: true } },
      ligacao: { select: { id: true } },
    },
    orderBy: { dataReuniao: "asc" },
  });

  const now = new Date();
  const futuros = agendamentos.filter((a) => a.dataReuniao && new Date(a.dataReuniao) >= now);
  const passados = agendamentos.filter((a) => a.dataReuniao && new Date(a.dataReuniao) < now);

  // Agrupa futuros por dia
  const futurosByDay = futuros.reduce((acc, a) => {
    if (!a.dataReuniao) return acc;
    const day = new Date(a.dataReuniao).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(a);
    return acc;
  }, {} as Record<string, typeof agendamentos>);

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-5xl space-y-10">
      {/* ===== Header ===== */}
      <header className="stagger-1 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Calendário · agendamentos
          </p>
          <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
            Reuniões
            <span className="font-display italic text-muted-foreground"> · {futuros.length} à frente</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Todas as reuniões que a Marina marcou pra você no Google Calendar.
          </p>
        </div>
        <Link
          href="https://calendar.google.com"
          target="_blank"
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-accent self-start md:self-auto"
        >
          Abrir Google Calendar
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </header>

      {/* ===== Próximas ===== */}
      {Object.keys(futurosByDay).length > 0 ? (
        <section className="stagger-2 space-y-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Próximas · {futuros.length}
          </p>
          {Object.entries(futurosByDay).map(([day, items]) => (
            <div key={day}>
              <h2 className="font-display text-2xl tracking-tight mb-3 capitalize">
                {day}
              </h2>
              <div className="space-y-2">
                {items.map((a, i) => (
                  <AgendamentoCard key={a.id} agendamento={a} delay={i * 30} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <EmptyState />
      )}

      {/* ===== Passados ===== */}
      {passados.length > 0 && (
        <section className="stagger-3 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Histórico · {passados.length}
          </p>
          <div className="space-y-2 opacity-70">
            {passados.slice(0, 10).map((a, i) => (
              <AgendamentoCard key={a.id} agendamento={a} delay={i * 20} muted />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AgendamentoCard({
  agendamento,
  delay,
  muted,
}: {
  agendamento: {
    id: number;
    titulo: string | null;
    dataReuniao: Date | null;
    duracaoMinutos: number | null;
    googleEventId: string | null;
    observacoes: string | null;
    status: string | null;
    lead: { id: number; nome: string; telefone: string; grauProximidade: string | null } | null;
    ligacao: { id: number } | null;
  };
  delay: number;
  muted?: boolean;
}) {
  const statusInfo = STATUS_LABELS[agendamento.status || ""] || {
    label: agendamento.status || "—",
    cls: "bg-muted text-muted-foreground ring-1 ring-border",
  };
  const time = agendamento.dataReuniao
    ? new Date(agendamento.dataReuniao).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <Card
      className="lift overflow-hidden border-border/60"
      style={{ animation: `stagger-fade 0.4s ease-out ${delay}ms both` }}
    >
      <div className="p-5 grid grid-cols-[auto_1fr_auto] gap-4 items-start">
        {/* time column */}
        <div className={`text-right shrink-0 ${muted ? "opacity-60" : ""}`}>
          <p className="font-display text-3xl tracking-tight tabular-nums leading-none">
            {time}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
            {agendamento.duracaoMinutos || 30} min
          </p>
        </div>

        {/* divider */}
        <div className="absolute left-[7.5rem] top-5 bottom-5 w-px bg-border/60 hidden" />

        {/* content */}
        <div className="min-w-0 border-l border-border/60 pl-4">
          <div className="flex items-start gap-2 flex-wrap mb-1">
            <p className="font-display text-xl tracking-tight leading-tight">
              {agendamento.titulo || `Reunião com ${agendamento.lead?.nome}`}
            </p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>
          {agendamento.lead && (
            <p className="text-sm text-muted-foreground">
              {agendamento.lead.nome} ·{" "}
              <span className="font-mono">{agendamento.lead.telefone}</span>
              {agendamento.lead.grauProximidade && (
                <>
                  {" · "}
                  <span className="font-bold">Grau {agendamento.lead.grauProximidade}</span>
                </>
              )}
            </p>
          )}
          {agendamento.observacoes && (
            <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">
              "{agendamento.observacoes}"
            </p>
          )}
        </div>

        {/* actions */}
        <div className="flex items-center gap-1 shrink-0">
          {agendamento.ligacao?.id && (
            <Link
              href={`/dashboard/ligacoes/${agendamento.ligacao.id}`}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Ver gravação"
            >
              Gravação
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
          {agendamento.googleEventId && (
            <Link
              href={`https://calendar.google.com/calendar/u/0/r/eventedit/${agendamento.googleEventId}`}
              target="_blank"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Abrir no Google Calendar"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

function EmptyState() {
  return (
    <Card className="border-border/60 p-12 text-center">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Calendar className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-2xl tracking-tight">
        Nenhuma reunião <span className="italic">por enquanto</span>.
      </p>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Quando a Marina fechar agendamentos durante as ligações, eles aparecem aqui em ordem
        cronológica.
      </p>
    </Card>
  );
}
