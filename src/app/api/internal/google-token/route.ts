import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshAccessToken } from "@/lib/google";

/**
 * Endpoint INTERNO consultado pelo n8n na hora de agendar reunião.
 *
 * Fluxo:
 *  1. n8n manda lead_id ou franqueado_id
 *  2. Buscamos o franqueado dono daquele lead
 *  3. Se ele conectou Google → retorna access_token + calendar dele
 *  4. Se NÃO conectou → cai pro admin do sistema (franqueado #1) como fallback
 *  5. Se nem admin conectou → 503 (precisa alguém conectar)
 *
 * Resposta:
 *  {
 *    access_token: "...",
 *    calendar_id: "email@gmail.com",
 *    email: "...",
 *    franqueado_id: 1,
 *    used_fallback: false
 *  }
 *
 * Proteção: header `x-internal-key` deve bater com env INTERNAL_API_KEY.
 */
export async function POST(req: Request) {
  const internalKey = req.headers.get("x-internal-key");
  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as
    | { lead_id?: number | string; franqueado_id?: number | string }
    | null;

  if (!body) return NextResponse.json({ error: "Body inválido" }, { status: 400 });

  let franqueadoId: number | null = null;

  if (body.franqueado_id) {
    franqueadoId = Number(body.franqueado_id);
  } else if (body.lead_id) {
    const lead = await prisma.lead.findUnique({
      where: { id: Number(body.lead_id) },
      include: { campanha: { select: { franqueadoId: true } } },
    });
    franqueadoId = lead?.campanha?.franqueadoId ?? null;
  }

  if (!franqueadoId) {
    return NextResponse.json({ error: "Franqueado não identificado" }, { status: 404 });
  }

  // Tenta o franqueado dono do lead
  const franqueado = await prisma.franqueado.findUnique({ where: { id: franqueadoId } });

  if (franqueado?.googleRefreshToken) {
    try {
      const tokens = await refreshAccessToken(franqueado.googleRefreshToken);
      return NextResponse.json({
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        calendar_id: franqueado.googleCalendarId || franqueado.googleEmail || "primary",
        email: franqueado.googleEmail,
        franqueado_id: franqueadoId,
        used_fallback: false,
      });
    } catch (e) {
      console.error("[google-token] refresh falhou pro franqueado:", e);
      // segue pro fallback
    }
  }

  // Fallback: usa o admin do sistema (franqueado_id=1 = Alex Sanabria)
  const admin = await prisma.franqueado.findFirst({
    where: { googleRefreshToken: { not: null } },
    orderBy: { id: "asc" },
  });

  if (!admin || !admin.googleRefreshToken) {
    return NextResponse.json(
      {
        error: "Nenhuma conta Google conectada no sistema",
        hint: "Conecte Google Calendar em /dashboard/calendario",
      },
      { status: 503 }
    );
  }

  try {
    const tokens = await refreshAccessToken(admin.googleRefreshToken);
    return NextResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      calendar_id: admin.googleCalendarId || admin.googleEmail || "primary",
      email: admin.googleEmail,
      franqueado_id: franqueadoId,
      used_fallback: true,
      fallback_reason: franqueado?.googleRefreshToken
        ? "Token do franqueado expirou"
        : "Franqueado não conectou Google Calendar",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return NextResponse.json(
      { error: "Refresh do admin falhou", details: msg },
      { status: 502 }
    );
  }
}
