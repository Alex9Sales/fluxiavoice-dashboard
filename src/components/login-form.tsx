"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";

export function LoginForm({
  callbackUrl,
  error: initialError,
}: {
  callbackUrl?: string;
  error?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "CredentialsSignin" ? "E-mail ou senha incorretos." : null
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }

    router.push(callbackUrl || "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FieldShell label="E-mail" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="seu@email.com"
          required
          autoComplete="email"
          className="h-11 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
      </FieldShell>

      <FieldShell
        label="Senha"
        htmlFor="password"
        rightSlot={
          <Link
            href="/signup"
            className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors"
          >
            Esqueci
          </Link>
        }
      >
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="h-11 border-0 bg-transparent px-0 pr-9 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
          <button
            type="button"
            onClick={() => setShowPwd((s) => !s)}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={showPwd ? "Esconder senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </FieldShell>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="group h-12 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <>
            Entrar no painel
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}

/**
 * Field with floating mini-label + underline focus. Subtle editorial look.
 */
function FieldShell({
  label,
  htmlFor,
  rightSlot,
  children,
}: {
  label: string;
  htmlFor: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative border-b border-border pb-1 focus-within:border-foreground transition-colors">
      <div className="flex items-center justify-between">
        <Label
          htmlFor={htmlFor}
          className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
        >
          {label}
        </Label>
        {rightSlot}
      </div>
      {children}
    </div>
  );
}
