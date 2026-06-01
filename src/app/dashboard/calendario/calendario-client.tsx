"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Unlink, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CalendarioClient({
  connected,
  email,
  calendarId,
  connectedAt,
}: {
  connected: boolean;
  email: string | null;
  calendarId: string | null;
  connectedAt: string | null;
}) {
  const router = useRouter();
  const [disconnecting, setDisconnecting] = useState(false);

  async function handleDisconnect() {
    if (!confirm("Desconectar Google Calendar? As próximas reuniões voltam pro calendário padrão.")) return;
    setDisconnecting(true);
    const res = await fetch("/api/google/disconnect", { method: "POST" });
    setDisconnecting(false);
    if (res.ok) router.refresh();
  }

  if (!connected) {
    return (
      <Card className="border-border/60 p-8 text-center">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Calendar className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl tracking-tight">
          Você ainda não conectou seu <span className="italic">Google Calendar</span>.
        </p>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          As reuniões agendadas pela Marina estão indo pra um calendário compartilhado padrão.
          Conecte sua conta pra recebê-las direto.
        </p>
        <a
          href="/api/google/auth"
          className="inline-flex items-center gap-2 mt-6 rounded-full bg-foreground text-background px-6 py-3 text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          <GoogleIcon />
          Conectar Google Calendar
        </a>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-500/30 bg-emerald-500/5 p-6">
      <div className="flex items-start gap-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30 shrink-0">
          <Calendar className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-400">
            Conectado
          </p>
          <p className="font-display text-2xl tracking-tight mt-1 leading-tight truncate">
            {email}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Calendário: <span className="font-mono">{calendarId || "primary"}</span>
            {connectedAt && (
              <>
                {" · "}desde{" "}
                {new Date(connectedAt).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="rounded-full h-9 px-4 shrink-0"
        >
          {disconnecting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Unlink className="h-4 w-4 mr-1.5" />
              Desconectar
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#FFFFFF"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#FFFFFF"
        opacity="0.85"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z"
      />
      <path
        fill="#FFFFFF"
        opacity="0.7"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.99 10.99 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#FFFFFF"
        opacity="0.55"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
