import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { refreshAccessToken } from "@/lib/google";

/**
 * Endpoint INTERNO — consultado pelo n8n na hora de agendar reunião.
 *
 * Recebe o lead_id (vindo da tool agendar_reuniao do Retell), descobre a campanha →
 * franqueado, troca o refresh_token salvo por access_token fresco, retorna pro n8n.
 *
 * Protegido por header `x-internal-key` = INTERNAL_API_KEY.
 *
 * Resposta:
 *  - Conectado: { access_token, calendar_id, email }
 *  - Não conectado: { access_token: null, calendar_id: null, fallback: true }
 *    (n8n usa a credencial Alex padrão como fallback)
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
    return NextResponse.json({ error: "Franqueado não encontrado" }, { status: 404 });
  }

  const f = await prisma.franqueado.findUnique({ where: { id: franqueadoId } });
  if (!f || !f.googleRefreshToken) {
    return NextResponse.json({
      access_token: null,
      calendar_id: null,
      email: null,
      fallback: true,
      reason: "Franqueado não conectou Google Calendar — n8n usa fallback",
    });
  }

  try {
    const tokens = await refreshAccessToken(f.googleRefreshToken);
    return NextResponse.json({
      access_token: tokens.access_token,
      expires_in: tokens.expires_in,
      calendar_id: f.googleCalendarId || f.googleEmail || "primary",
      email: f.googleEmail,
      fallback: false,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    console.error("[internal google-token] refresh falhou:", msg);
    return NextResponse.json(
      { error: "Refresh falhou", details: msg, fallback: true },
      { status: 502 }
    );
  }
}
