import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revokeToken } from "@/lib/google";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const franqueadoId = Number(session.user.id);

  const f = await prisma.franqueado.findUnique({ where: { id: franqueadoId } });
  if (!f) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

  if (f.googleRefreshToken) {
    await revokeToken(f.googleRefreshToken).catch(() => {});
  }

  await prisma.franqueado.update({
    where: { id: franqueadoId },
    data: {
      googleEmail: null,
      googleRefreshToken: null,
      googleCalendarId: null,
      googleConnectedAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
