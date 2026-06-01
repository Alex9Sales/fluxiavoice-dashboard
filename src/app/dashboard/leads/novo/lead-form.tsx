"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check, AlertCircle, ArrowRight } from "lucide-react";

const SKIP = "__none__";

const GRAUS = [
  { v: "A", label: "A · Próximo", desc: "amigo / família" },
  { v: "B", label: "B · Conhecido", desc: "rede comercial" },
  { v: "C1", label: "C1 · Frio", desc: "indicação distante" },
];

export function LeadForm({ campanhas }: { campanhas: { id: number; nome: string }[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [grau, setGrau] = useState<string>(SKIP);
  const [veioRec, setVeioRec] = useState<string>("false");
  const [campanhaId, setCampanhaId] = useState<string>(String(campanhas[0]?.id ?? ""));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      campanhaId: Number(campanhaId),
      nome: String(form.get("nome") || "").trim(),
      telefone: String(form.get("telefone") || "").trim(),
      grauProximidade: grau !== SKIP ? grau : null,
      veioDeRecomendacao: veioRec === "true",
      quemRecomendou: String(form.get("quemRecomendou") || "").trim() || null,
      observacoes: String(form.get("observacoes") || "").trim() || null,
    };

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error || "Erro ao salvar." });
      return;
    }

    setResult({ ok: true, message: `${payload.nome} entrou na fila.` });
    setTimeout(() => router.push("/dashboard/leads"), 1000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {/* Section 1 — Dados básicos */}
      <Section
        index="01"
        title="Quem é"
        subtitle="O nome e o número que a Marina vai discar."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Nome completo" htmlFor="nome" required>
            <Input id="nome" name="nome" placeholder="Maria de Oliveira" required className="h-11" />
          </Field>
          <Field label="Telefone" htmlFor="telefone" hint="Com ou sem DDD/+55" required>
            <Input id="telefone" name="telefone" placeholder="+55 67 99999-9999" required className="h-11 font-mono" />
          </Field>
        </div>
      </Section>

      {/* Section 2 — Contexto */}
      <Section
        index="02"
        title="Contexto"
        subtitle="Ajuda a Marina a adaptar a conversa."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Grau de proximidade">
            <Select value={grau} onValueChange={(v: string | null) => setGrau(v ?? SKIP)}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)] max-w-[420px]">
                <SelectItem value={SKIP}>— não informado —</SelectItem>
                {GRAUS.map((g) => (
                  <SelectItem key={g.v} value={g.v}>
                    <span className="flex items-baseline gap-2">
                      <strong>{g.label}</strong>
                      <span className="text-xs text-muted-foreground">{g.desc}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Campanha de destino" required>
            <Select value={campanhaId} onValueChange={(v: string | null) => setCampanhaId(v ?? "")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue placeholder="Escolha a campanha" />
              </SelectTrigger>
              <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                {campanhas.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Veio de recomendação?">
            <Select value={veioRec} onValueChange={(v: string | null) => setVeioRec(v ?? "false")}>
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Não</SelectItem>
                <SelectItem value="true">Sim — alguém indicou</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Quem recomendou" htmlFor="quemRecomendou">
            <Input
              id="quemRecomendou"
              name="quemRecomendou"
              placeholder="Ex: Carlos Eduardo"
              disabled={veioRec !== "true"}
              className="h-11"
            />
          </Field>
        </div>
      </Section>

      {/* Section 3 — Notas */}
      <Section
        index="03"
        title="Notas"
        subtitle="Opcional — anotações que ajudam o vendedor depois."
      >
        <Textarea
          id="observacoes"
          name="observacoes"
          placeholder="Como conheceu, contexto, observações…"
          rows={3}
          className="resize-none"
        />
      </Section>

      {result && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
            result.ok
              ? "bg-emerald-500/8 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
              : "bg-destructive/8 text-destructive border-destructive/30"
          }`}
        >
          {result.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {result.message}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-border/50">
        <Button
          type="button"
          variant="outline"
          className="rounded-full px-5"
          onClick={() => router.push("/dashboard/leads")}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="rounded-full px-6 bg-foreground text-background hover:bg-foreground/90 group"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <>
              Adicionar lead
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function Section({
  index,
  title,
  subtitle,
  children,
}: {
  index: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 gap-y-3 items-start">
      <div className="md:sticky md:top-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {index}
        </p>
        <p className="font-display text-xl tracking-tight mt-1">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-foreground/80">
        {label}
        {required && <span className="ml-1 text-[oklch(0.65_0.18_70)]">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
