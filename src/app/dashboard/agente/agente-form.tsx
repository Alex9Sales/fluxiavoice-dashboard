"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, AlertCircle, Play, Pause, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Voice = {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent?: string | null;
  gender?: string | null;
  preview_audio_url?: string | null;
};

type AgenteFormProps = {
  initial: {
    campanhaId: number;
    nomeIa: string;
    retellAgentId: string;
    retellVoiceId: string;
  };
  vozes: Voice[];
};

export function AgenteForm({ initial, vozes }: AgenteFormProps) {
  const router = useRouter();
  const [nomeIa, setNomeIa] = useState(initial.nomeIa);
  const [voiceId, setVoiceId] = useState(initial.retellVoiceId);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Preview audio state
  const [playing, setPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function previewVoice(v: Voice) {
    if (!v.preview_audio_url) return;
    if (playing === v.voice_id) {
      audioRef.current?.pause();
      setPlaying(null);
      return;
    }
    audioRef.current?.pause();
    audioRef.current = new Audio(v.preview_audio_url);
    audioRef.current.play();
    audioRef.current.onended = () => setPlaying(null);
    setPlaying(v.voice_id);
  }

  async function handleSave() {
    setSaving(true);
    setResult(null);

    const res = await fetch("/api/agente", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campanhaId: initial.campanhaId,
        nomeIa: nomeIa.trim(),
        retellVoiceId: voiceId,
      }),
    });

    setSaving(false);
    const data = await res.json();

    if (!res.ok) {
      setResult({ ok: false, message: data.error || "Erro ao salvar." });
      return;
    }
    setResult({ ok: true, message: "Salvo. Próxima ligação já usa a nova configuração." });
    router.refresh();
  }

  return (
    <div className="space-y-8 stagger-2">
      {/* ===== Seção 01 — Nome ===== */}
      <Section
        index="01"
        title="Nome da IA"
        subtitle="Como ela se apresenta no início da ligação."
      >
        <Card className="border-border/60 p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nomeIa" className="text-xs font-medium">
              Nome
            </Label>
            <Input
              id="nomeIa"
              value={nomeIa}
              onChange={(e) => setNomeIa(e.target.value)}
              placeholder="Marina, Sofia, Beatriz, Carla…"
              maxLength={30}
              className="h-11 max-w-xs font-display text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Ex: <em>&quot;Alô, boa tarde, aqui é a <strong>{nomeIa || "Marina"}</strong>…&quot;</em>
            </p>
          </div>
        </Card>
      </Section>

      {/* ===== Seção 02 — Voz ===== */}
      <Section
        index="02"
        title="Voz"
        subtitle="Escolha entre vozes prontas em PT-BR ou suas vozes customizadas (ElevenLabs clone)."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {vozes.length === 0 ? (
            <Card className="md:col-span-3 border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Não foi possível carregar as vozes da Retell agora.
              </p>
            </Card>
          ) : (
            vozes.map((v) => {
              const selected = voiceId === v.voice_id;
              const isPlaying = playing === v.voice_id;
              const isCustom = v.voice_id.startsWith("custom-");
              return (
                <button
                  type="button"
                  key={v.voice_id}
                  onClick={() => setVoiceId(v.voice_id)}
                  className={`group relative rounded-2xl border p-4 text-left transition-all ${
                    selected
                      ? "border-foreground/40 bg-foreground/[0.03] shadow-md"
                      : "border-border/60 hover:border-foreground/30 hover:bg-accent/40"
                  }`}
                >
                  {selected && (
                    <span className="absolute top-3 right-3 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-display text-lg tracking-tight leading-tight">
                        {v.voice_name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">
                        {v.provider}
                        {v.gender && ` · ${v.gender}`}
                      </p>
                    </div>
                    {isCustom && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[oklch(0.85_0.15_75/0.15)] px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider text-[oklch(0.5_0.18_60)] dark:text-[oklch(0.85_0.15_75)]">
                        <Sparkles className="h-2.5 w-2.5" /> sua
                      </span>
                    )}
                  </div>
                  {v.preview_audio_url && (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        previewVoice(v);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          previewVoice(v);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider hover:bg-accent mt-1 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {isPlaying ? "Pausar" : "Ouvir"}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Section>

      {/* ===== Seção 03 — Clone (info) ===== */}
      <Section
        index="03"
        title="Clone de voz"
        subtitle="Quer que a IA fale com a sua voz? Hoje fazemos manualmente."
      >
        <Card className="border-border/60 bg-gradient-to-br from-[oklch(0.5_0.22_275/0.04)] to-[oklch(0.78_0.16_70/0.04)] p-6">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-xl tracking-tight">
                Clone sua voz <span className="italic">(em breve)</span>
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Em breve você sobe uns 3 minutos de áudio gravado e a gente clona sua voz pra IA.
                Por enquanto, se quiser fazer agora, fale com o suporte — ativamos manualmente
                pra você.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Disponível como add-on do plano. <span className="italic">Em breve</span>.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ===== Result ===== */}
      {result && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${
            result.ok
              ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : "bg-destructive/8 text-destructive border-destructive/30"
          }`}
        >
          {result.ok ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {result.message}
        </div>
      )}

      {/* ===== Sticky save bar ===== */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-full border border-border/80 bg-card/90 px-5 py-3 shadow-lg backdrop-blur">
        <div className="text-sm">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mr-2">
            Editando
          </span>
          <span className="font-display text-lg tracking-tight">{nomeIa || "Marina"}</span>
          <span className="text-muted-foreground"> · {voiceId || "voz não selecionada"}</span>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !nomeIa.trim() || !voiceId}
          className="rounded-full h-9 px-6 bg-foreground text-background hover:bg-foreground/90"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar mudanças
        </Button>
      </div>
    </div>
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
    <section className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-x-8 gap-y-3 items-start">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
          {index}
        </p>
        <p className="font-display text-xl tracking-tight mt-1">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
      </div>
      <div>{children}</div>
    </section>
  );
}
