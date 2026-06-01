import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  nome: z.string().min(2),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("[signup] dados inválidos:", parsed.error.flatten());
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, nome, password } = parsed.data;
    const senhaHash = await bcrypt.hash(password, 10);

    const franqueado = await prisma.franqueado.upsert({
      where: { email: email.toLowerCase() },
      update: {
        nome,
        senhaHash,
        ativo: true,
      },
      create: {
        email: email.toLowerCase(),
        nome,
        senhaHash,
        ativo: true,
      },
    });

    console.log("[signup] OK:", { id: franqueado.id, email: franqueado.email });
    return NextResponse.json({ id: franqueado.id, email: franqueado.email });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[signup] erro:", error);
    return NextResponse.json(
      { error: "Erro ao cadastrar", details: msg },
      { status: 500 }
    );
  }
}
