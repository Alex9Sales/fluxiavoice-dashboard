import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens, fetchUserInfo } from "@/lib/google";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const back = (params: Record<string, string>) => {
    const u = new URL("/dashboard/calendario", process.env.NEXTAUTH_URL || url.origin);
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    return NextResponse.redirect(u);
  };

  if (error) {
    return back({ error });
  }

  if (!code || !state) {
    return back({ error: "missing_params" });
  }

  // Verifica state assinado
  let franqueadoId: number;
  try {
    const decoded = Buffer.from(state, "base64url").toString();
    const [id, hmac] = decoded.split(":");
    const expectedHmac = crypto
      .createHmac("sha256", process.env.NEXTAUTH_SECRET || "fallback")
      .update(id)
      .digest("hex")
      .slice(0, 16);
    if (hmac !== expectedHmac) throw new Error("State HMAC inválido");
    franqueadoId = Number(id);
  } catch {
    return back({ error: "invalid_state" });
  }

  // Confere sessão atual bate com o state
  const session = await auth();
  if (!session?.user?.id || Number(session.user.id) !== franqueadoId) {
    return back({ error: "session_mismatch" });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.refresh_token) {
      // Sem refresh_token — geralmente significa que já autorizou antes e Google não reemite
      // Solução: usuário vai em https://myaccount.google.com/permissions e revoga, depois tenta de novo
      return back({ error: "no_refresh_token" });
    }

    const userInfo = await fetchUserInfo(tokens.access_token);

    await prisma.franqueado.update({
      where: { id: franqueadoId },
      data: {
        googleEmail: userInfo.email,
        googleRefreshToken: tokens.refresh_token,
        googleConnectedAt: new Date(),
        // Define calendar primário do usuário como padrão (pode trocar depois)
        googleCalendarId: userInfo.email,
      },
    });

    return back({ ok: "1" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    console.error("[google callback] erro:", msg);
    return back({ error: "token_exchange_failed", details: msg });
  }
}
