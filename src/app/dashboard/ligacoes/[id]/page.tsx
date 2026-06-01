import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Phone, Calendar, Clock, DollarSign, User, ExternalLink } from "lucide-react";
import Link from "next/link";
import { AudioPlayer } from "./audio-player";

const RESULT_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  agendar:      { label: "Agendou",      cls: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30", dot: "bg-emerald-500" },
  interesse:    { label: "Interesse",    cls: "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30",     dot: "bg-indigo-500" },
  sem_interesse:{ label: "Sem interesse",cls: "bg-muted text-muted-foreground ring-1 ring-border",                                    dot: "bg-muted-foreground/40" },
  callback:     { label: "Retorno",      cls: "bg-amber-500/12 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",         dot: "bg-amber-500" },
  voicemail:    { label: "Caixa postal", cls: "bg-muted text-muted-foreground ring-1 ring-border",                                    dot: "bg-muted-foreground/40" },
  no_answer:    { label: "Não atendeu",  cls: "bg-muted text-muted-foreground ring-1 ring-border",                                    dot: "bg-muted-foreground/40" },
};

export default async function LigacaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);
  const { id } = await params;
  const ligacaoId = Number(id);

  const ligacao = await prisma.ligacao.findFirst({
    where: {
      id: ligacaoId,
      lead: { campanha: { franqueadoId } },
    },
    include: {
      lead: { select: { id: true, nome: true, telefone: true, grauProximidade: true, quemRecomendou: true } },
      agendamentos: true,
    },
  });

  if (!ligacao) notFound();

  const resInfo = RESULT_LABELS[ligacao.resultado || ""] || {
    label: ligacao.resultado || "—",
    cls: "bg-muted text-muted-foreground ring-1 ring-border",
    dot: "bg-muted-foreground/40",
  };

  const dur = ligacao.duracaoSegundos
    ? `${Math.floor(ligacao.duracaoSegundos / 60)}m ${String(ligacao.duracaoSegundos % 60).padStart(2, "0")}s`
    : "—";

  const cost = ligacao.custoCentavos ? `US$ ${(ligacao.custoCentavos / 100).toFixed(2)}` : "—";

  // Parse transcrição em turnos
  const turns = parseTranscript(ligacao.transcricao || "");

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-5xl space-y-8">
      <header className="stagger-1">
        <Link
          href="/dashboard/ligacoes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar pra ligações
        </Link>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Ligação · #{ligacao.id}
            </p>
            <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
              {ligacao.lead?.nome || "—"}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <Link
                href={`tel:${ligacao.lead?.telefone}`}
                className="font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                {ligacao.lead?.telefone}
              </Link>
              {ligacao.lead?.grauProximidade && (
                <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-[11px] font-bold ring-1 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30">
                  {ligacao.lead.grauProximidade}
                </span>
              )}
              {ligacao.lead?.quemRecomendou && (
                <span className="text-xs text-muted-foreground">
                  via <span className="italic text-foreground">{ligacao.lead.quemRecomendou}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${resInfo.cls}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${resInfo.dot}`} />
              {resInfo.label}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground text-right">
              {ligacao.createdAt && new Date(ligacao.createdAt).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" })}
            </span>
          </div>
        </div>
      </header>

      {/* ===== Quick stats ===== */}
      <section className="stagger-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatChip icon={<Clock className="h-4 w-4" />} label="Duração" value={dur} />
        <StatChip icon={<DollarSign className="h-4 w-4" />} label="Custo" value={cost} />
        <StatChip icon={<Phone className="h-4 w-4" />} label="Status" value={ligacao.callStatus || "—"} />
        <StatChip icon={<User className="h-4 w-4" />} label="Lead ID" value={`#${ligacao.lead?.id || "—"}`} />
      </section>

      {/* ===== Agendamento (se houver) ===== */}
      {ligacao.agendamentos.length > 0 && (
        <section className="stagger-3">
          {ligacao.agendamentos.map((ag) => (
            <Card key={ag.id} className="overflow-hidden border-emerald-500/30 bg-emerald-500/5">
              <div className="p-5 flex items-start gap-4">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 shrink-0">
                  <Calendar className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
                    Reunião marcada
                  </p>
                  <p className="font-display text-2xl tracking-tight mt-1 leading-tight">
                    {ag.titulo || "Reunião"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {ag.dataReuniao &&
                      new Date(ag.dataReuniao).toLocaleString("pt-BR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                    · {ag.duracaoMinutos} min
                  </p>
                  {ag.observacoes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">"{ag.observacoes}"</p>
                  )}
                </div>
                {ag.googleEventId && (
                  <Link
                    href={`https://calendar.google.com/calendar/u/0/r/eventedit/${ag.googleEventId}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent shrink-0"
                  >
                    Calendar
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </section>
      )}

      {/* ===== Resumo ===== */}
      {ligacao.resumo && (
        <section className="stagger-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Resumo · gerado por IA
          </p>
          <Card className="border-border/60 p-5">
            <p className="font-display text-lg leading-relaxed italic text-foreground/90">
              "{ligacao.resumo}"
            </p>
          </Card>
        </section>
      )}

      {/* ===== Player ===== */}
      {ligacao.urlGravacao && (
        <section className="stagger-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Gravação
          </p>
          <AudioPlayer src={ligacao.urlGravacao} />
        </section>
      )}

      {/* ===== Transcrição ===== */}
      {turns.length > 0 && (
        <section className="stagger-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
            Transcrição — {turns.length} turnos
          </p>
          <Card className="border-border/60 p-6 space-y-4">
            {turns.map((turn, i) => (
              <TurnBubble key={i} role={turn.role} text={turn.text} index={i} />
            ))}
          </Card>
        </section>
      )}
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        <p className="font-medium text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

function TurnBubble({ role, text, index }: { role: "agent" | "user"; text: string; index: number }) {
  const isAgent = role === "agent";
  return (
    <div
      className={`flex gap-3 ${isAgent ? "" : "flex-row-reverse"}`}
      style={{ animation: `stagger-fade 0.4s ease-out ${index * 30}ms both` }}
    >
      <div
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-mono uppercase ${
          isAgent
            ? "bg-gradient-to-br from-[oklch(0.5_0.22_275)] to-[oklch(0.62_0.18_265)] text-white"
            : "bg-muted text-foreground ring-1 ring-border"
        }`}
      >
        {isAgent ? "M" : "L"}
      </div>
      <div className={`flex-1 max-w-[80%] ${isAgent ? "" : "flex flex-col items-end"}`}>
        <p className={`font-mono text-[9px] uppercase tracking-[0.2em] mb-1 ${isAgent ? "text-[oklch(0.5_0.22_275)] dark:text-[oklch(0.78_0.16_275)]" : "text-muted-foreground"}`}>
          {isAgent ? "Marina" : "Lead"}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAgent
              ? "bg-[oklch(0.5_0.22_275/0.06)] text-foreground rounded-tl-md"
              : "bg-muted text-foreground rounded-tr-md"
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  );
}

/**
 * Parse o formato "Agent: ...\nUser: ...\n" em turnos estruturados.
 */
function parseTranscript(raw: string): Array<{ role: "agent" | "user"; text: string }> {
  if (!raw) return [];
  const turns: Array<{ role: "agent" | "user"; text: string }> = [];
  // split por linhas e re-agregar quando aparecer rótulo
  const lines = raw.split("\n");
  let current: { role: "agent" | "user"; text: string } | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const agentMatch = trimmed.match(/^(?:Agent|Marina|Agente):\s*(.*)$/i);
    const userMatch = trimmed.match(/^(?:User|Lead|Usuário|Usuario):\s*(.*)$/i);
    if (agentMatch) {
      if (current) turns.push(current);
      current = { role: "agent", text: agentMatch[1] };
    } else if (userMatch) {
      if (current) turns.push(current);
      current = { role: "user", text: userMatch[1] };
    } else if (current) {
      current.text += " " + trimmed;
    }
  }
  if (current) turns.push(current);
  return turns;
}
