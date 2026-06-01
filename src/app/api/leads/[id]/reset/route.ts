import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const leadId = Number(id);
  const franqueadoId = Number(session.user.id);

  // Verifica posse via JOIN com campanha
  const lead = await prisma.lead.findFirst({
    where: { id: leadId, campanha: { franqueadoId } },
  });
  if (!lead) return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 });

  await prisma.lead.update({
    where: { id: leadId },
    data: {
      status: "pendente",
      tentativas: 0,
      ultimaTentativa: null,
      proximaTentativa: null,
    },
  });

  return NextResponse.json({ ok: true });
}
