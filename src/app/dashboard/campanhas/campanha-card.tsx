"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Megaphone, Clock, Play, Pause } from "lucide-react";
import { useRouter } from "next/navigation";

const DIAS_NOMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function CampanhaCard({
  campanha,
  stats,
  delay,
}: {
  campanha: {
    id: number;
    nome: string;
    tipo: string | null;
    ativa: boolean | null;
    horarioInicio: string;
    horarioFim: string;
    diasSemana: number[];
    maxTentativas: number;
    nomeIa: string | null;
  };
  stats: { total: number; pendente: number; agendado: number; ligando: number };
  delay: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [ativa, setAtiva] = useState(!!campanha.ativa);
  const [horarioInicio, setHorarioInicio] = useState(campanha.horarioInicio);
  const [horarioFim, setHorarioFim] = useState(campanha.horarioFim);
  const [diasSemana, setDiasSemana] = useState<number[]>(campanha.diasSemana);
  const [maxTentativas, setMaxTentativas] = useState(campanha.maxTentativas);

  function toggleDia(d: number) {
    setDiasSemana((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function salvar() {
    setSaving(true);
    setFeedback(null);

    const res = await fetch(`/api/campanhas/${campanha.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ativa,
        horarioInicio,
        horarioFim,
        diasSemana,
        maxTentativas,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setFeedback(`❌ ${data.error || "Erro ao salvar."}`);
      return;
    }

    setFeedback("✅ Salvo.");
    setEditing(false);
    router.refresh();
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <Card
      className="lift overflow-hidden border-border/60"
      style={{ animation: `stagger-fade 0.4s ease-out ${delay}ms both` }}
    >
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
        {/* Esquerda — info */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shrink-0">
              <Megaphone className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {campanha.tipo || "Agendamento"} · IA {campanha.nomeIa || "Marina"}
              </p>
              <p className="font-display text-2xl tracking-tight leading-tight">{campanha.nome}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                ativa
                  ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30"
                  : "bg-muted text-muted-foreground ring-1 ring-border"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${ativa ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
              {ativa ? "Ativa" : "Pausada"}
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Leads" value={stats.total} />
            <Stat label="Pendentes" value={stats.pendente} tone="amber" />
            <Stat label="Ligando" value={stats.ligando} tone="blue" />
            <Stat label="Agendados" value={stats.agendado} tone="emerald" />
          </div>

          {!editing ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground pt-2 border-t border-border/40">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span className="font-mono tabular-nums">
                  {horarioInicio} → {horarioFim}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                {DIAS_NOMES.map((d, i) => (
                  <span
                    key={i}
                    className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[9px] font-bold ${
                      diasSemana.includes(i)
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground/40"
                    }`}
                  >
                    {d[0]}
                  </span>
                ))}
              </span>
              <span className="text-xs">
                Máx <strong className="text-foreground">{maxTentativas}</strong> tentativas
              </span>
            </div>
          ) : (
            <div className="space-y-4 pt-2 border-t border-border/40">
              {/* Horários */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Horário início</Label>
                  <Input
                    type="time"
                    value={horarioInicio}
                    onChange={(e) => setHorarioInicio(e.target.value)}
                    className="h-10 font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Horário fim</Label>
                  <Input
                    type="time"
                    value={horarioFim}
                    onChange={(e) => setHorarioFim(e.target.value)}
                    className="h-10 font-mono"
                  />
                </div>
              </div>

              {/* Dias da semana */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Dias da semana</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {DIAS_NOMES.map((d, i) => {
                    const selected = diasSemana.includes(i);
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => toggleDia(i)}
                        className={`h-10 w-12 rounded-full text-xs font-medium transition-colors ${
                          selected
                            ? "bg-foreground text-background"
                            : "border border-border bg-card text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Max tentativas */}
              <div className="space-y-1.5 max-w-32">
                <Label className="text-xs font-medium">Máx tentativas</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxTentativas}
                  onChange={(e) => setMaxTentativas(Math.max(1, Number(e.target.value) || 1))}
                  className="h-10 font-mono"
                />
              </div>

              {/* Toggle ativa */}
              <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
                <button
                  type="button"
                  onClick={() => setAtiva((v) => !v)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full shrink-0 ${
                    ativa
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ativa ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ativa ? "Campanha ativa" : "Campanha pausada"}</p>
                  <p className="text-xs text-muted-foreground">
                    {ativa
                      ? "Disparador pega leads desta campanha"
                      : "Disparador ignora esta campanha"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setAtiva((v) => !v)}
                  className="rounded-full"
                >
                  {ativa ? "Pausar" : "Ativar"}
                </Button>
              </div>
            </div>
          )}

          {feedback && (
            <p className="text-xs text-muted-foreground">{feedback}</p>
          )}
        </div>

        {/* Direita — ações */}
        <div className="flex lg:flex-col gap-2 items-start lg:items-end">
          {editing ? (
            <>
              <Button
                onClick={salvar}
                disabled={saving}
                className="rounded-full h-9 px-5 bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditing(false);
                  setAtiva(!!campanha.ativa);
                  setHorarioInicio(campanha.horarioInicio);
                  setHorarioFim(campanha.horarioFim);
                  setDiasSemana(campanha.diasSemana);
                  setMaxTentativas(campanha.maxTentativas);
                }}
                className="rounded-full h-9 px-4"
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={() => setEditing(true)}
              className="rounded-full h-9 px-4"
            >
              Editar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "amber" | "blue" | "emerald";
}) {
  const toneCls = {
    amber: "text-amber-700 dark:text-amber-300",
    blue: "text-blue-700 dark:text-blue-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
  };
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className={`font-display text-2xl tabular-nums leading-none mt-0.5 ${tone ? toneCls[tone] : ""}`}>
        {value}
      </p>
    </div>
  );
}
