import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { CalendarioClient } from "./calendario-client";
import { Calendar as CalIcon, CheckCircle2, AlertCircle } from "lucide-react";

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; details?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const franqueado = await prisma.franqueado.findUnique({
    where: { id: franqueadoId },
    select: {
      googleEmail: true,
      googleCalendarId: true,
      googleConnectedAt: true,
    },
  });

  const connected = !!franqueado?.googleEmail;

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-3xl space-y-10">
      <header className="stagger-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Integração · Google Calendar
        </p>
        <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
          Seu <span className="italic">calendário</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          Conecte sua conta Google. As reuniões que a Marina agendar caem direto no
          <strong> seu calendário pessoal</strong> — não passa mais pelo nosso.
        </p>
      </header>

      {params.ok && (
        <Card className="stagger-2 border-emerald-500/30 bg-emerald-500/5 p-4">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Conectado com sucesso! Próximas reuniões caem no seu calendário.
          </div>
        </Card>
      )}
      {params.error && (
        <Card className="stagger-2 border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p>Não foi possível conectar: <strong>{prettyError(params.error)}</strong></p>
              {params.error === "no_refresh_token" && (
                <p className="mt-1 text-xs">
                  Você precisa revogar o acesso anterior em{" "}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener"
                    className="underline"
                  >
                    myaccount.google.com/permissions
                  </a>{" "}
                  e tentar de novo.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="stagger-3">
        <CalendarioClient
          connected={connected}
          email={franqueado?.googleEmail || null}
          calendarId={franqueado?.googleCalendarId || null}
          connectedAt={franqueado?.googleConnectedAt?.toISOString() || null}
        />
      </div>

      {/* Info card */}
      <Card className="stagger-4 border-border/60 bg-gradient-to-br from-[oklch(0.5_0.22_275/0.04)] to-[oklch(0.78_0.16_70/0.04)] p-6">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shrink-0">
            <CalIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-xl tracking-tight">Como funciona</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground leading-relaxed">
              <li>1. Você clica <strong className="text-foreground">Conectar Google</strong></li>
              <li>2. Autoriza na tela do Google (escolhe a conta certa)</li>
              <li>3. Voltamos pra cá com a conexão ativa</li>
              <li>4. Toda reunião que a Marina agendar vai direto pro seu calendário pessoal</li>
              <li>5. Você pode <strong className="text-foreground">desconectar</strong> a qualquer momento</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

function prettyError(err: string): string {
  const map: Record<string, string> = {
    no_refresh_token: "Conta já autorizada antes — revogue e tente de novo",
    invalid_state: "Sessão expirou — recarregue e tente de novo",
    session_mismatch: "Sessão não bate — saia e entre novamente",
    token_exchange_failed: "Falha na troca de token",
    missing_params: "Faltou code ou state",
    access_denied: "Você negou o acesso",
  };
  return map[err] || err;
}
