import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const patchSchema = z.object({
  campanhaId: z.number().int().positive(),
  nomeIa: z.string().min(1).max(50),
  retellVoiceId: z.string().min(1).max(100),
});

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const franqueadoId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { campanhaId, nomeIa, retellVoiceId } = parsed.data;

    const campanha = await prisma.campanha.findFirst({
      where: { id: campanhaId, franqueadoId },
    });
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    // 1. Atualiza no Retell se tem agent_id (muda voice_id no Retell agent)
    if (campanha.retellAgentId && process.env.RETELL_API_KEY) {
      const retellRes = await fetch(
        `https://api.retellai.com/update-agent/${campanha.retellAgentId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voice_id: retellVoiceId }),
        }
      );
      if (!retellRes.ok) {
        const text = await retellRes.text();
        console.error("[agente PATCH] retell update-agent falhou:", text);
        return NextResponse.json(
          { error: "Falha ao atualizar voz no Retell", details: text },
          { status: 502 }
        );
      }
    }

    // 2. Atualiza no banco
    await prisma.campanha.update({
      where: { id: campanhaId },
      data: { nomeIa, retellVoiceId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    console.error("[agente PATCH] erro:", error);
    return NextResponse.json({ error: "Erro ao atualizar agente", details: msg }, { status: 500 });
  }
}
