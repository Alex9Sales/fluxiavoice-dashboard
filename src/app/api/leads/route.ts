import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  campanhaId: z.number().int().positive(),
  nome: z.string().min(1),
  telefone: z.string().min(1),
  grauProximidade: z.string().nullable().optional(),
  veioDeRecomendacao: z.boolean().optional(),
  quemRecomendou: z.string().nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

function normalizeTelefone(t: string, dddDefault = "67"): string | null {
  const onlyDigits = t.replace(/\D/g, "");
  if (onlyDigits.length === 0) return null;
  if (onlyDigits.length === 12 || onlyDigits.length === 13) return "+" + onlyDigits;
  if (onlyDigits.length === 10 || onlyDigits.length === 11) return "+55" + onlyDigits;
  if (onlyDigits.length === 8 || onlyDigits.length === 9) return "+55" + dddDefault + onlyDigits;
  return null;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const franqueadoId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;

    // Verifica posse da campanha
    const campanha = await prisma.campanha.findFirst({
      where: { id: data.campanhaId, franqueadoId },
    });
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    const tel = normalizeTelefone(data.telefone);
    if (!tel) {
      return NextResponse.json(
        { error: "Telefone inválido. Use o formato +55 67 99999-9999 ou só os dígitos." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        campanhaId: data.campanhaId,
        nome: data.nome.trim(),
        telefone: tel,
        grauProximidade: data.grauProximidade?.trim().toUpperCase() || null,
        veioDeRecomendacao: Boolean(data.veioDeRecomendacao),
        quemRecomendou: data.quemRecomendou?.trim() || null,
        observacoes: data.observacoes?.trim() || null,
        status: "pendente",
      },
    });

    return NextResponse.json({ id: lead.id, nome: lead.nome });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    console.error("[leads POST] erro:", error);
    return NextResponse.json({ error: "Erro ao criar lead", details: msg }, { status: 500 });
  }
}
