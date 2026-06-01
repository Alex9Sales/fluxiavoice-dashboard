import { SignupForm } from "@/components/signup-form";
import { BrandMark, BrandWord, SoundLine } from "@/components/brand";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-background">
      {/* LEFT — Editorial canvas */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-[oklch(0.18_0.018_280)] text-[oklch(0.97_0.004_85)] grain">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.78_0.16_70/0.28),transparent_60%),radial-gradient(ellipse_at_bottom_left,oklch(0.55_0.22_275/0.32),transparent_55%)]"
        />
        <div aria-hidden className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <header className="relative z-10 flex items-center gap-3 px-12 pt-10">
          <BrandMark size="md" />
          <BrandWord size="md" />
        </header>

        <main className="relative z-10 px-12 pb-12">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 backdrop-blur">
            Convidado
          </p>

          <h1 className="font-display text-[clamp(2.5rem,4.5vw,4.5rem)] leading-[0.95] tracking-[-0.025em] text-white">
            Defina sua <span className="italic text-[oklch(0.85_0.15_75)]">senha</span> e <br />
            comece a deixar a <br />
            Marina ligar por você.
          </h1>

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/70">
            Em segundos, você vira franqueado da plataforma e seu painel fica pronto pra subir os
            primeiros contatos.
          </p>

          <div className="mt-12 flex items-center gap-4">
            <SoundLine bars={38} className="h-10 w-72 text-white/30" variant="fade" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
              franqueado · onboarding
            </span>
          </div>
        </main>

        <footer className="relative z-10 flex items-center justify-between px-12 pb-8 text-[11px] uppercase tracking-[0.2em] text-white/40">
          <span>v1 · piloto fechado</span>
          <span className="font-display italic text-white/60">Sales Tecnologia</span>
        </footer>
      </aside>

      {/* RIGHT — Form */}
      <section className="relative flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="absolute left-6 top-6 flex items-center gap-3 lg:hidden">
          <BrandMark size="sm" />
          <BrandWord size="sm" />
        </div>

        <div className="w-full max-w-sm">
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              Onboarding — franqueado
            </p>
            <h2 className="font-display text-4xl tracking-[-0.025em] leading-tight">
              Bem-vindo(a) à <span className="italic">Fluxia</span>.
            </h2>
            <p className="text-sm text-muted-foreground">
              Cadastre sua senha. Se o e-mail já existir, atualizamos.
            </p>
          </div>

          <div className="mt-10">
            <SignupForm />
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Já tem senha?{" "}
            <Link
              href="/login"
              className="font-medium text-foreground underline underline-offset-4 decoration-[oklch(0.78_0.16_70)] decoration-[2px] hover:decoration-foreground transition-colors"
            >
              entrar
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
