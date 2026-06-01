import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Phone, ArrowUpRight, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 30;

const RESULT_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  agendar:      { label: "Agendou",      cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30", dot: "bg-emerald-500" },
  interesse:    { label: "Interesse",    cls: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30",     dot: "bg-indigo-500" },
  sem_interesse:{ label: "Sem interesse",cls: "bg-muted text-muted-foreground ring-1 ring-border",                                   dot: "bg-muted-foreground/40" },
  callback:     { label: "Retorno",      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",         dot: "bg-amber-500" },
  voicemail:    { label: "Caixa postal", cls: "bg-muted text-muted-foreground ring-1 ring-border",                                   dot: "bg-muted-foreground/40" },
  no_answer:    { label: "Não atendeu",  cls: "bg-muted text-muted-foreground ring-1 ring-border",                                   dot: "bg-muted-foreground/40" },
};

export default async function LigacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ resultado?: string; page?: string }>;
}) {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const params = await searchParams;
  const resultado = params.resultado || "";
  const page = Math.max(1, Number(params.page) || 1);

  const campanhaIds = (
    await prisma.campanha.findMany({
      where: { franqueadoId },
      select: { id: true },
    })
  ).map((c) => c.id);

  const where: Prisma.LigacaoWhereInput = { lead: { campanhaId: { in: campanhaIds } } };
  if (resultado) where.resultado = resultado;

  const [total, ligacoes, agrupado] = await Promise.all([
    prisma.ligacao.count({ where }),
    prisma.ligacao.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { lead: { select: { nome: true, telefone: true, grauProximidade: true } } },
    }),
    prisma.ligacao.groupBy({
      by: ["resultado"],
      where: { lead: { campanhaId: { in: campanhaIds } } },
      _count: { _all: true },
    }),
  ]);

  const resultadosMap = Object.fromEntries(agrupado.map((g) => [g.resultado ?? "", g._count._all]));
  const totalGeral = agrupado.reduce((s, g) => s + g._count._all, 0);

  // estatísticas agregadas
  const stats = await prisma.ligacao.aggregate({
    where: { lead: { campanhaId: { in: campanhaIds } } },
    _sum: { duracaoSegundos: true, custoCentavos: true },
  });
  const minutosTotais = Math.round((stats._sum.duracaoSegundos || 0) / 60);
  const custoTotalUSD = ((stats._sum.custoCentavos || 0) / 100).toFixed(2);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-7xl space-y-8">
      {/* ===== Header ===== */}
      <header className="stagger-1 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Operação · histórico
          </p>
          <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
            Ligações
            <span className="font-display italic text-muted-foreground"> · {total}</span>
          </h1>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono tabular-nums">{minutosTotais} min totais</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono tabular-nums">US$ {custoTotalUSD}</span>
          </div>
        </div>
      </header>

      {/* ===== Result filters ===== */}
      <section className="stagger-2 flex flex-wrap gap-2">
        <FilterChip current={resultado} value="" label="Todas" count={totalGeral} dot="bg-foreground" />
        {Object.entries(RESULT_LABELS).map(([key, info]) => (
          <FilterChip key={key} current={resultado} value={key} label={info.label} count={resultadosMap[key] || 0} dot={info.dot} />
        ))}
      </section>

      {/* ===== Tabela ===== */}
      <Card className="stagger-3 overflow-hidden border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 pl-6">Lead</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Resultado</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Duração</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Custo</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Quando</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ligacoes.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="py-16">
                    <EmptyState />
                  </TableCell>
                </TableRow>
              ) : (
                ligacoes.map((lig, i) => {
                  const info = RESULT_LABELS[lig.resultado || ""] || {
                    label: lig.resultado || "—",
                    cls: "bg-muted text-muted-foreground ring-1 ring-border",
                    dot: "bg-muted-foreground/40",
                  };
                  const dur = lig.duracaoSegundos
                    ? `${Math.floor(lig.duracaoSegundos / 60)}m ${String(lig.duracaoSegundos % 60).padStart(2, "0")}s`
                    : "—";
                  const cost = lig.custoCentavos ? `$${(lig.custoCentavos / 100).toFixed(2)}` : "—";
                  return (
                    <TableRow
                      key={lig.id}
                      className="border-border/50"
                      style={{ animation: `stagger-fade 0.4s ease-out ${i * 14}ms both` }}
                    >
                      <TableCell className="pl-6 py-4">
                        <p className="font-medium leading-tight">{lig.lead?.nome || "—"}</p>
                        <p className="font-mono text-[11px] text-muted-foreground mt-0.5">{lig.lead?.telefone}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${info.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${info.dot}`} />
                          {info.label}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono tabular-nums text-sm">{dur}</TableCell>
                      <TableCell className="font-mono tabular-nums text-sm text-muted-foreground">{cost}</TableCell>
                      <TableCell className="font-mono tabular-nums text-xs text-muted-foreground">
                        {lig.createdAt
                          ? new Date(lig.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-3">
                        <Link
                          href={`/dashboard/ligacoes/${lig.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ===== Paginação ===== */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Página {page} · de {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`?${new URLSearchParams({ ...(resultado && { resultado }), page: String(page - 1) })}`}>
                <Button variant="outline" size="sm" className="rounded-full">Anterior</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?${new URLSearchParams({ ...(resultado && { resultado }), page: String(page + 1) })}`}>
                <Button variant="outline" size="sm" className="rounded-full">Próxima</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  current,
  value,
  label,
  count,
  dot,
}: {
  current: string;
  value: string;
  label: string;
  count: number;
  dot: string;
}) {
  const isActive = current === value;
  const params = new URLSearchParams();
  if (value) params.set("resultado", value);
  return (
    <Link
      href={`?${params.toString()}`}
      className={`group inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
        isActive
          ? "bg-foreground text-background border-foreground"
          : "border-border/60 text-foreground hover:bg-accent"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-[oklch(0.85_0.15_75)]" : dot}`} />
      {label}
      <span
        className={`tabular-nums font-mono text-[10px] px-1.5 py-0.5 rounded-md ${
          isActive ? "bg-background/15 text-background/90" : "bg-muted text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Phone className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-2xl tracking-tight">Nenhuma ligação ainda.</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Quando a Marina começar a ligar, as conversas aparecem aqui — com gravação e transcrição.
      </p>
    </div>
  );
}
