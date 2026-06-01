import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAuthUrl } from "@/lib/google";
import crypto from "crypto";

/**
 * Inicia o OAuth flow. State carrega o franqueado_id assinado pra prevenir CSRF.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  // State = base64(franqueadoId:hmac)
  const franqueadoId = session.user.id;
  const secret = process.env.NEXTAUTH_SECRET || "fallback";
  const hmac = crypto.createHmac("sha256", secret).update(franqueadoId).digest("hex").slice(0, 16);
  const state = Buffer.from(`${franqueadoId}:${hmac}`).toString("base64url");

  return NextResponse.redirect(buildAuthUrl(state));
}
