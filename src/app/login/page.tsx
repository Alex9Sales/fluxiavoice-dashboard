import { LoginForm } from "@/components/login-form";
import { BrandMark, BrandWord, SoundLine } from "@/components/brand";
import Link from "next/link";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* ============================== LEFT — Editorial canvas ============================== */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[oklch(0.18_0.018_280)] text-[oklch(0.97_0.004_85)] grain">
        {/* atmospheric gradient */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.55_0.22_275/0.35),transparent_60%),radial-gradient(ellipse_at_bottom_right,oklch(0.78_0.16_70/0.18),transparent_55%)]"
        />
        {/* faint horizon line */}
        <div aria-hidden className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <header className="relative z-10 flex items-center gap-3 px-12 pt-10">
          <BrandMark size="md" />
          <BrandWord size="md" />
        </header>

        <main className="relative z-10 px-12 pb-12">
          {/* Decorative little ticker */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/70 backdrop-blur">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-amber-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
            </span>
            Marina ao vivo · agente de voz
          </div>

          <h1 className="font-display text-[clamp(2.5rem,4.5vw,4.5rem)] leading-[0.95] tracking-[-0.025em] text-white">
            A voz que <span className="italic text-[oklch(0.85_0.15_75)]">fecha agendas</span> <br />
            enquanto você <br /> dorme.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
            Sua IA conversa em português, contorna objeção, marca a reunião e ainda confirma o endereço.
            Você só aparece pra fechar o negócio.
          </p>

          {/* sound line ornament */}
          <div className="mt-12 flex items-center gap-4">
            <SoundLine bars={38} className="h-10 w-72 text-white/30" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              piloto · campo grande · ms
            </span>
          </div>
        </main>

        <footer className="relative z-10 flex items-center justify-between px-12 pb-8 text-[11px] uppercase tracking-[0.2em] text-white/40">
          <span>v1 · piloto fechado</span>
          <span className="font-display italic text-white/60">Sales Tecnologia</span>
        </footer>
      </aside>

      {/* ============================== RIGHT — Form ============================== */}
      <section className="relative flex items-center justify-center px-6 py-10 lg:py-16">
        {/* mobile-only top brand */}
        <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
          <BrandMark size="sm" />
          <BrandWord size="sm" />
        </div>

        <div className="w-full max-w-sm">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Entrar — painel
            </p>
            <h2 className="font-display text-4xl tracking-[-0.025em] leading-tight">
              Bom te ver de <span className="italic">volta</span>.
            </h2>
            <p className="text-sm text-muted-foreground">
              Use o e-mail e a senha do franqueado.
            </p>
          </div>

          <div className="mt-10">
            <LoginForm callbackUrl={callbackUrl} error={error} />
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Primeira vez aqui?{" "}
            <Link
              href="/signup"
              className="font-medium text-foreground underline underline-offset-4 decoration-[oklch(0.78_0.16_70)] decoration-[2px] hover:decoration-foreground transition-colors"
            >
              cadastrar senha
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
