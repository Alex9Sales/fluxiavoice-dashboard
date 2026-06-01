import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { UploadClient } from "./upload-client";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function UploadPage() {
  const session = await auth();
  const franqueadoId = Number(session!.user.id);

  const campanhas = await prisma.campanha.findMany({
    where: { franqueadoId, ativa: true },
    select: { id: true, nome: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="px-8 py-10 lg:px-12 lg:py-12 max-w-5xl space-y-8">
      <header className="stagger-1">
        <Link
          href="/dashboard/leads"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar pra leads
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Importação · planilha CIT
        </p>
        <h1 className="font-display text-5xl tracking-[-0.025em] mt-2 leading-none">
          Suba sua <span className="italic">planilha</span>.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground max-w-xl">
          A gente detecta o cabeçalho, mapeia as colunas e normaliza os telefones automaticamente.
          Suporta múltiplas abas e formatos <span className="font-mono text-xs">.xlsx</span>,{" "}
          <span className="font-mono text-xs">.xls</span> ou{" "}
          <span className="font-mono text-xs">.csv</span>.
        </p>
      </header>

      <div className="stagger-2">
        <UploadClient campanhas={campanhas} />
      </div>
    </div>
  );
}
