import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { CampanhaCard } from "./campanha-card";
import { Megaphone } from "lucide-react";

export default async function CampanhasPage() {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const campanhas = await prisma.campanha.findMany({
    where: { franqueadoId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { leads: true } },
    },
  });

  // Pra cada campanha, conta leads agrupados por status
  const campanhaIds = campanhas.map((c) => c.id);
  const statusCounts = await prisma.lead.groupBy({
    by: ["campanhaId", "status"],
    where: { campanhaId: { in: campanhaIds } },
    _count: { _all: true },
  });

  const statsByCampanha = campanhas.reduce((acc, c) => {
    const rows = statusCounts.filter((s) => s.campanhaId === c.id);
    acc[c.id] = {
      total: c._count.leads,
      pendente: rows.find((r) => r.status === "pendente")?._count._all || 0,
      agendado: rows.find((r) => r.status === "agendado")?._count._all || 0,
      ligando: rows.find((r) => r.status === "ligando")?._count._all || 0,
    };
    return acc;
  }, {} as Record<number, { total: number; pendente: number; agendado: number; ligando: number }>);

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-5xl space-y-10">
      <header className="stagger-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Configuração · campanhas
        </p>
        <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
          Suas <span className="italic">campanhas</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Cada campanha tem horário, dias da semana e número máximo de tentativas próprios.
          Mudanças entram em vigor na <strong>próxima ligação</strong> que o disparador fizer.
        </p>
      </header>

      {campanhas.length === 0 ? (
        <Card className="stagger-2 border-border/60 p-12 text-center">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-display text-2xl tracking-tight">Nenhuma campanha ainda.</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Sua campanha é criada automaticamente quando seu cadastro é provisionado. Fale com o
            suporte se algo deu errado.
          </p>
        </Card>
      ) : (
        <div className="stagger-2 space-y-4">
          {campanhas.map((c, i) => (
            <CampanhaCard
              key={c.id}
              campanha={{
                id: c.id,
                nome: c.nome,
                tipo: c.tipo,
                ativa: c.ativa,
                horarioInicio: c.horarioInicio ? toHHMM(c.horarioInicio) : "09:00",
                horarioFim: c.horarioFim ? toHHMM(c.horarioFim) : "18:00",
                diasSemana: c.diasSemana,
                maxTentativas: c.maxTentativas ?? 3,
                nomeIa: c.nomeIa,
              }}
              stats={statsByCampanha[c.id]}
              delay={i * 60}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function toHHMM(d: Date): string {
  // Postgres Time vem como Date com data 1970-01-01; pega só hora/min
  const iso = new Date(d).toISOString();
  return iso.slice(11, 16);
}
