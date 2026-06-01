import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // req.auth pode ser um objeto vazio em alguns casos — checar user.id é mais seguro
  const isLoggedIn = !!req.auth?.user?.id;
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/signup") ||
    // Endpoints server-to-server (n8n consulta): protegidos pelo header x-internal-key
    pathname.startsWith("/api/internal") ||
    // Callbacks externos (Retell webhooks, Google OAuth callback): sem sessão
    pathname.startsWith("/api/retell-webhook");

  // Rotas privadas sem sessão → redireciona pro login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logado tentando ir pro /login ou /signup → manda pro dashboard
  if (isLoggedIn && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
