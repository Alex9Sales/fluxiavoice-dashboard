"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") || "");
    const nome = String(form.get("nome") || "");
    const password = String(form.get("password") || "");

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Falha ao cadastrar.");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 1200);
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

      <FieldShell label="Nome" htmlFor="nome">
        <Input
          id="nome"
          name="nome"
          type="text"
          placeholder="Como te chamamos"
          required
          autoComplete="name"
          className="h-11 border-0 bg-transparent px-0 text-[15px] shadow-none focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
      </FieldShell>

      <FieldShell label="Senha — mínimo 6 caracteres" htmlFor="password">
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPwd ? "text" : "password"}
            required
            minLength={6}
            autoComplete="new-password"
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
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Senha cadastrada. Redirecionando…
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || success}
        className="group h-12 w-full rounded-full bg-foreground text-background hover:bg-foreground/90 text-[15px] font-medium"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <>
            Cadastrar senha
            <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </Button>
    </form>
  );
}

function FieldShell({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="group relative border-b border-border pb-1 focus-within:border-foreground transition-colors">
      <Label
        htmlFor={htmlFor}
        className="block font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
