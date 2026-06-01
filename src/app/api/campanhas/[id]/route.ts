import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  ativa: z.boolean().optional(),
  horarioInicio: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  horarioFim: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  diasSemana: z.array(z.number().int().min(0).max(6)).optional(),
  maxTentativas: z.number().int().min(1).max(10).optional(),
});

function hhmmToDate(hhmm: string): Date {
  return new Date(`1970-01-01T${hhmm}:00.000Z`);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const franqueadoId = Number(session.user.id);

    const { id } = await ctx.params;
    const campanhaId = Number(id);

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const campanha = await prisma.campanha.findFirst({
      where: { id: campanhaId, franqueadoId },
    });
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const data: {
      ativa?: boolean;
      horarioInicio?: Date;
      horarioFim?: Date;
      diasSemana?: number[];
      maxTentativas?: number;
    } = {};
    if (parsed.data.ativa !== undefined) data.ativa = parsed.data.ativa;
    if (parsed.data.horarioInicio) data.horarioInicio = hhmmToDate(parsed.data.horarioInicio);
    if (parsed.data.horarioFim) data.horarioFim = hhmmToDate(parsed.data.horarioFim);
    if (parsed.data.diasSemana) data.diasSemana = parsed.data.diasSemana;
    if (parsed.data.maxTentativas) data.maxTentativas = parsed.data.maxTentativas;

    await prisma.campanha.update({
      where: { id: campanhaId },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    console.error("[campanhas PATCH] erro:", error);
    return NextResponse.json({ error: "Erro ao atualizar campanha", details: msg }, { status: 500 });
  }
}
