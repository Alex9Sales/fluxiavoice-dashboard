import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { AgenteForm } from "./agente-form";
import { BrandMark } from "@/components/brand";

export default async function AgentePage() {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  // Pega a campanha "principal" do franqueado (primeira ativa)
  const campanha = await prisma.campanha.findFirst({
    where: { franqueadoId, ativa: true },
    orderBy: { createdAt: "asc" },
  });

  if (!campanha) {
    return (
      <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-3xl">
        <Card className="border-border/60 p-10 text-center">
          <p className="font-display text-2xl tracking-tight">Sem campanha ativa.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie uma campanha primeiro pra configurar o agente.
          </p>
        </Card>
      </div>
    );
  }

  // Busca vozes disponíveis (server-side, com cache)
  const vozes = await fetchVoices().catch(() => [] as Voice[]);

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-5xl space-y-10">
      {/* HERO */}
      <header className="stagger-1 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Configuração · agente de voz
          </p>
          <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
            Sua <span className="italic">voz</span> que liga.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl">
            Personalize o nome, a voz e o cérebro da IA que vai ligar pra seus leads. As mudanças
            aplicam <strong>imediatamente</strong> em todas as próximas ligações.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3">
          <BrandMark size="md" />
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Agente atual
            </p>
            <p className="font-display text-2xl tracking-tight">{campanha.nomeIa || "Marina"}</p>
          </div>
        </div>
      </header>

      <AgenteForm
        initial={{
          campanhaId: campanha.id,
          nomeIa: campanha.nomeIa || "Marina",
          retellAgentId: campanha.retellAgentId || "",
          retellVoiceId: campanha.retellVoiceId || "",
        }}
        vozes={vozes}
      />
    </div>
  );
}

/* ---------- Voice listing (server) ---------- */
type Voice = {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent?: string | null;
  gender?: string | null;
  preview_audio_url?: string | null;
};

async function fetchVoices(): Promise<Voice[]> {
  const key = process.env.RETELL_API_KEY;
  if (!key) return [];
  const res = await fetch("https://api.retellai.com/list-voices", {
    headers: { Authorization: `Bearer ${key}` },
    cache: "force-cache",
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const all = (await res.json()) as Voice[];
  // Filtra: brasileiras, ou custom, ou pt-BR
  return all.filter((v) => {
    const accent = (v.accent || "").toLowerCase();
    if (accent.includes("brazil") || accent.includes("portug")) return true;
    if (v.voice_id.toLowerCase().startsWith("custom-")) return true;
    if (/(camila|sofia|julia|keren|hailey|cimo|sarah|coral)/i.test(v.voice_name)) return true;
    return false;
  });
}
