"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadRowActions({ leadId, status }: { leadId: number; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function resetLead() {
    if (!confirm("Resetar este lead pra status 'pendente'? Ele entrará na fila do disparador.")) return;
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}/reset`, { method: "POST" });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  async function deleteLead() {
    if (!confirm("Excluir este lead PERMANENTEMENTE? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted">
          <MoreHorizontal className="w-4 h-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={resetLead} disabled={status === "pendente"}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar pra pendente
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={deleteLead} className="text-red-600 dark:text-red-400">
          <Trash2 className="w-4 h-4 mr-2" />
          Excluir lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
