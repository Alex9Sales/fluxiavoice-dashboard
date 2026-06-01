import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  campanhaId: z.number().int().positive(),
  dddDefault: z.string().regex(/^\d{2}$/).optional(),
  leads: z
    .array(
      z.object({
        nome: z.string().min(1),
        telefone: z.string().min(1),
        grauProximidade: z.string().nullable().optional(),
        veioDeRecomendacao: z.boolean().optional(),
        quemRecomendou: z.string().nullable().optional(),
      })
    )
    .min(1)
    .max(10_000),
});

function normalizeTelefone(t: string, dddDefault?: string): string | null {
  const onlyDigits = t.replace(/\D/g, "");

  // Se vier vazio
  if (onlyDigits.length === 0) return null;

  // Já vem com país (55XXXXXXXXXX = 12-13 dígitos)
  if (onlyDigits.length === 12 || onlyDigits.length === 13) {
    return "+" + onlyDigits;
  }

  // Com DDD (10-11 dígitos)
  if (onlyDigits.length === 10 || onlyDigits.length === 11) {
    return "+55" + onlyDigits;
  }

  // Sem DDD (8-9 dígitos) - usa DDD default
  if ((onlyDigits.length === 8 || onlyDigits.length === 9) && dddDefault) {
    // Se for 8 dígitos e começar com 9, considera que é celular antigo - mantém
    // Se for 8 dígitos sem o 9, é fixo - mantém
    // Se for 9 dígitos, é celular novo - mantém
    return "+55" + dddDefault + onlyDigits;
  }

  return null;
}

function normalizeGrau(g: string | null | undefined): string | null {
  if (!g) return null;
  const norm = g.trim().toUpperCase().replace(/\s+/g, "");
  // Aceita "A", "A1", "A2", "B", "C", "C1" - extrai a letra
  const match = norm.match(/^([ABC])/);
  if (!match) return null;
  const letter = match[1];
  // Pra grau C, mantém "C1" como label (compatível com schema atual)
  if (letter === "C") return "C1";
  return letter;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    const franqueadoId = Number(session.user.id);

    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { campanhaId, dddDefault, leads } = parsed.data;

    // Verifica se campanha pertence ao franqueado
    const campanha = await prisma.campanha.findFirst({
      where: { id: campanhaId, franqueadoId },
    });
    if (!campanha) {
      return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });
    }

    // Normaliza + filtra inválidos
    let ignorados = 0;
    const data = leads
      .map((l) => {
        if (!l.nome.trim()) { ignorados++; return null; }
        const tel = normalizeTelefone(l.telefone, dddDefault);
        if (!tel) { ignorados++; return null; }
        return {
          campanhaId,
          nome: l.nome.trim(),
          telefone: tel,
          grauProximidade: normalizeGrau(l.grauProximidade ?? null),
          veioDeRecomendacao: Boolean(l.veioDeRecomendacao),
          quemRecomendou: l.quemRecomendou?.trim() || null,
          status: "pendente" as const,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (data.length === 0) {
      return NextResponse.json(
        { error: "Nenhum lead válido encontrado. Verifique o mapeamento de colunas e o DDD padrão." },
        { status: 400 }
      );
    }

    // Bulk insert
    const result = await prisma.lead.createMany({
      data,
      skipDuplicates: true,
    });

    return NextResponse.json({ criados: result.count, ignorados, total: leads.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro";
    console.error("[import] erro:", error);
    return NextResponse.json({ error: "Erro ao importar", details: msg }, { status: 500 });
  }
}
