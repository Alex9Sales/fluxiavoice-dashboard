import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, UserPlus, Upload, Users } from "lucide-react";
import Link from "next/link";
import { LeadRowActions } from "./row-actions";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<string, { label: string; cls: string; dot: string }> = {
  pendente:      { label: "Pendente",     cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",   dot: "bg-amber-500" },
  ligando:       { label: "Ligando",      cls: "bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/25",       dot: "bg-blue-500" },
  atendido:      { label: "Atendido",     cls: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-1 ring-cyan-500/25",       dot: "bg-cyan-500" },
  agendado:      { label: "Agendado",     cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30", dot: "bg-emerald-500" },
  interessado:   { label: "Interessado",  cls: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/25", dot: "bg-indigo-500" },
  sem_interesse: { label: "Sem interesse",cls: "bg-muted text-muted-foreground ring-1 ring-border",                              dot: "bg-muted-foreground/40" },
  sem_resposta:  { label: "Sem resposta", cls: "bg-muted text-muted-foreground ring-1 ring-border",                              dot: "bg-muted-foreground/40" },
  callback:      { label: "Retorno",      cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/25",   dot: "bg-amber-500" },
  pausado:       { label: "Pausado",      cls: "bg-muted text-muted-foreground ring-1 ring-border",                              dot: "bg-muted-foreground/40" },
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; grau?: string; page?: string }>;
}) {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const params = await searchParams;
  const q = params.q?.trim() || "";
  const status = params.status || "";
  const grau = params.grau || "";
  const page = Math.max(1, Number(params.page) || 1);

  const campanhaIds = (
    await prisma.campanha.findMany({
      where: { franqueadoId },
      select: { id: true },
    })
  ).map((c) => c.id);

  const where: Prisma.LeadWhereInput = { campanhaId: { in: campanhaIds } };
  if (q) {
    where.OR = [
      { nome: { contains: q, mode: "insensitive" } },
      { telefone: { contains: q } },
    ];
  }
  if (status) where.status = status;
  if (grau) where.grauProximidade = grau;

  const [total, leads, statusCounts] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { campanha: { select: { nome: true } } },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: { campanhaId: { in: campanhaIds } },
      _count: { _all: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));
  const totalGeral = statusCounts.reduce((sum, s) => sum + s._count._all, 0);

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-7xl space-y-8">
      {/* ===== HEADER ===== */}
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between stagger-1">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Base · pessoas
          </p>
          <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
            Leads
            <span className="font-display italic text-muted-foreground"> · {total}</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {q || status || grau
              ? "Resultado dos filtros aplicados"
              : "Quem a Marina vai chamar pra sua agenda"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/leads/novo">
            <Button variant="outline" className="rounded-full h-10 px-5">
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </Link>
          <Link href="/dashboard/leads/upload">
            <Button className="rounded-full h-10 px-5 bg-foreground text-background hover:bg-foreground/90">
              <Upload className="h-4 w-4 mr-2" />
              Importar planilha
            </Button>
          </Link>
        </div>
      </header>

      {/* ===== Status chips ===== */}
      <section className="stagger-2 flex flex-wrap gap-2">
        <FilterChip current={status} value="" label="Todos" count={totalGeral} dot="bg-foreground" />
        {Object.entries(STATUS_LABELS).map(([key, info]) => (
          <FilterChip key={key} current={status} value={key} label={info.label} count={statusMap[key] || 0} dot={info.dot} />
        ))}
      </section>

      {/* ===== Search + grau filter ===== */}
      <Card className="stagger-3 border-border/60">
        <CardContent className="p-4">
          <form className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q}
                placeholder="Buscar por nome ou telefone…"
                className="pl-9 h-10 rounded-full bg-background border-border/80"
              />
            </div>
            <select
              name="grau"
              defaultValue={grau}
              className="h-10 px-4 border border-border/80 rounded-full bg-background text-sm font-medium"
            >
              <option value="">Todos os graus</option>
              <option value="A">Grau A — Próximo</option>
              <option value="B">Grau B — Conhecido</option>
              <option value="C1">Grau C1 — Frio</option>
            </select>
            {status && <input type="hidden" name="status" value={status} />}
            <Button type="submit" variant="outline" className="rounded-full h-10 px-5">
              <Filter className="h-4 w-4 mr-2" />
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ===== Tabela ===== */}
      <Card className="stagger-4 overflow-hidden border-border/60">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 pl-6">Nome</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Telefone</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Grau</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Status</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Tentativas</TableHead>
                <TableHead className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Última tentativa</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-16">
                    <EmptyLeads hasFilters={!!(q || status || grau)} />
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead, i) => {
                  const statusInfo = STATUS_LABELS[lead.status || ""] || { label: lead.status || "—", cls: "bg-muted text-muted-foreground ring-1 ring-border", dot: "bg-muted-foreground/40" };
                  return (
                    <TableRow
                      key={lead.id}
                      className="border-border/50"
                      style={{ animation: `stagger-fade 0.4s ease-out ${i * 18}ms both` }}
                    >
                      <TableCell className="pl-6 py-4">
                        <p className="font-medium leading-tight">{lead.nome}</p>
                        {lead.quemRecomendou && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            via <span className="italic">{lead.quemRecomendou}</span>
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{lead.telefone}</TableCell>
                      <TableCell>
                        {lead.grauProximidade ? (
                          <GrauBadge grau={lead.grauProximidade} />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${statusInfo.cls}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
                          {statusInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">{lead.tentativas || 0}</TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {lead.ultimaTentativa
                          ? new Date(lead.ultimaTentativa).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-3">
                        <LeadRowActions leadId={lead.id} status={lead.status || ""} />
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
              <Link href={`?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(grau && { grau }), page: String(page - 1) })}`}>
                <Button variant="outline" size="sm" className="rounded-full">Anterior</Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={`?${new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(grau && { grau }), page: String(page + 1) })}`}>
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
  if (value) params.set("status", value);
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

function GrauBadge({ grau }: { grau: string }) {
  const tone =
    grau === "A"
      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-emerald-500/30"
      : grau === "B"
      ? "bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 ring-indigo-500/30"
      : "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full text-[11px] font-bold ring-1 ${tone}`}
    >
      {grau}
    </span>
  );
}

function EmptyLeads({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center max-w-md mx-auto">
      <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Users className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="font-display text-2xl tracking-tight">
        {hasFilters ? "Nada por aqui." : "Sua base ainda está vazia."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasFilters
          ? "Tenta tirar um filtro pra ver mais resultados."
          : "Comece importando uma planilha CIT ou cadastrando o primeiro contato."}
      </p>
      {!hasFilters && (
        <div className="mt-5 flex items-center justify-center gap-2">
          <Link
            href="/dashboard/leads/upload"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background hover:bg-foreground/90"
          >
            <Upload className="h-3.5 w-3.5" /> Importar planilha
          </Link>
          <Link
            href="/dashboard/leads/novo"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium hover:bg-accent"
          >
            <UserPlus className="h-3.5 w-3.5" /> Adicionar contato
          </Link>
        </div>
      )}
    </div>
  );
}
