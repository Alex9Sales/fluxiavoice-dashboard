"use client";

import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, Check, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Mapping = {
  nome: string;
  telefone: string;
  grau: string;
  veioDeRecomendacao: string;
  quemRecomendou: string;
};

type SheetData = {
  name: string;
  rows: (string | number)[][];
  selected: boolean;
  headerRow: number;
};

const SKIP = "__skip__";

export function UploadClient({ campanhas }: { campanhas: { id: number; nome: string }[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [previewSheetIdx, setPreviewSheetIdx] = useState(0);
  const [mapping, setMapping] = useState<Mapping>({
    nome: SKIP, telefone: SKIP, grau: SKIP, veioDeRecomendacao: SKIP, quemRecomendou: SKIP,
  });
  const [campanhaId, setCampanhaId] = useState<string>(String(campanhas[0]?.id ?? ""));
  const [dddDefault, setDddDefault] = useState<string>("67");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const currentSheet = sheets[previewSheetIdx];
  const headers = useMemo(() => {
    if (!currentSheet || currentSheet.rows.length === 0) return [];
    const headerRow = Math.min(currentSheet.headerRow, currentSheet.rows.length - 1);
    return currentSheet.rows[headerRow].map((c, i) => String(c || "").trim() || `COLUNA_${i + 1}`);
  }, [currentSheet]);

  const dataRowsCurrent = useMemo(() => {
    if (!currentSheet) return [];
    return currentSheet.rows.slice(currentSheet.headerRow + 1).filter((row) =>
      row.some((cell) => cell !== null && cell !== undefined && String(cell).trim() !== "")
    );
  }, [currentSheet]);

  const totalSelectedLeads = useMemo(() => {
    return sheets
      .filter((s) => s.selected)
      .reduce((sum, s) => {
        const rows = s.rows.slice(s.headerRow + 1).filter((row) =>
          row.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
        );
        return sum + rows.length;
      }, 0);
  }, [sheets]);

  function autoDetectHeader(rows: (string | number)[][]): number {
    const tokens = ["NOME", "TELEFONE", "CELULAR", "FONE", "WHATS"];
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = rows[i];
      const hits = row.filter((c) => {
        const s = String(c || "").toUpperCase();
        return tokens.some((t) => s.includes(t));
      }).length;
      if (hits >= 2) return i;
    }
    return 0;
  }

  function autoMap(hs: string[]): Mapping {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const find = (...cands: string[]) =>
      hs.find((h) => {
        const n = norm(h);
        return cands.some((c) => n.includes(c.toLowerCase()));
      }) || SKIP;
    return {
      nome: find("nome", "name", "cliente"),
      telefone: find("telefone", "celular", "fone", "whats", "phone"),
      grau: find("abc1", "abc", "grau", "categor", "classific"),
      veioDeRecomendacao: find("recomenda", "indicad", "deonde", "conhece"),
      quemRecomendou: find("indicador"),
    };
  }

  async function handleFile(f: File) {
    setResult(null);
    const ext = f.name.toLowerCase().split(".").pop() || "";
    if (!["xlsx", "xls", "csv"].includes(ext)) {
      setResult({ ok: false, message: `Formato .${ext} não suportado. Use .xlsx, .xls ou .csv.` });
      setFile(null);
      setSheets([]);
      return;
    }

    setFile(f);
    const buf = await f.arrayBuffer();
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buf, { type: "array" });
    } catch {
      setResult({ ok: false, message: "Não consegui ler esse arquivo." });
      setFile(null);
      return;
    }

    const allSheets: SheetData[] = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: "" });
      return {
        name,
        rows,
        selected: true,
        headerRow: autoDetectHeader(rows),
      };
    });

    setSheets(allSheets);
    setPreviewSheetIdx(0);

    // Auto-map baseado na primeira aba
    if (allSheets[0]?.rows.length > 0) {
      const hs = allSheets[0].rows[allSheets[0].headerRow].map((c, i) => String(c || "").trim() || `COLUNA_${i + 1}`);
      setMapping(autoMap(hs));
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  function toggleSheet(idx: number) {
    setSheets((prev) => prev.map((s, i) => i === idx ? { ...s, selected: !s.selected } : s));
  }

  function toggleAllSheets(value: boolean) {
    setSheets((prev) => prev.map((s) => ({ ...s, selected: value })));
  }

  function changeHeaderRow(idx: number, v: string) {
    const newRow = Math.max(0, Math.min(sheets[idx].rows.length - 1, Number(v) - 1));
    setSheets((prev) => prev.map((s, i) => i === idx ? { ...s, headerRow: newRow } : s));
    if (idx === previewSheetIdx) {
      const hs = sheets[idx].rows[newRow].map((c, i) => String(c || "").trim() || `COLUNA_${i + 1}`);
      setMapping(autoMap(hs));
    }
  }

  async function submit() {
    setLoading(true);
    setResult(null);

    // Coleta leads de TODAS as abas selecionadas
    const allLeads: Array<{
      nome: string;
      telefone: string;
      grauProximidade: string | null;
      veioDeRecomendacao: boolean;
      quemRecomendou: string | null;
    }> = [];

    sheets.filter((s) => s.selected).forEach((sheet) => {
      const sheetHeaders = sheet.rows[sheet.headerRow].map((c, i) =>
        String(c || "").trim() || `COLUNA_${i + 1}`
      );
      const dataRows = sheet.rows.slice(sheet.headerRow + 1).filter((row) =>
        row.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
      );

      dataRows.forEach((row) => {
        const obj: Record<string, string | number> = {};
        sheetHeaders.forEach((h, i) => { obj[h] = row[i] ?? ""; });
        allLeads.push({
          nome: String(mapping.nome !== SKIP ? obj[mapping.nome] ?? "" : "").trim(),
          telefone: String(mapping.telefone !== SKIP ? obj[mapping.telefone] ?? "" : "").trim(),
          grauProximidade: mapping.grau !== SKIP ? String(obj[mapping.grau] ?? "").trim().toUpperCase() : null,
          veioDeRecomendacao: mapping.veioDeRecomendacao !== SKIP
            ? Boolean(String(obj[mapping.veioDeRecomendacao] ?? "").trim())
            : false,
          quemRecomendou: mapping.quemRecomendou !== SKIP ? String(obj[mapping.quemRecomendou] ?? "").trim() : null,
        });
      });
    });

    const res = await fetch("/api/leads/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campanhaId: Number(campanhaId),
        dddDefault: dddDefault.replace(/\D/g, ""),
        leads: allLeads,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult({ ok: false, message: data.error || "Erro ao importar." });
      return;
    }

    setResult({
      ok: true,
      message: `${data.criados} lead(s) criado(s)${data.ignorados ? `, ${data.ignorados} ignorado(s) (telefone inválido ou duplicado)` : ""}.`,
    });
    setTimeout(() => router.push("/dashboard/leads"), 1500);
  }

  const previewRows = useMemo(() => dataRowsCurrent.slice(0, 5), [dataRowsCurrent]);
  const canSubmit = file && totalSelectedLeads > 0 && mapping.nome !== SKIP && mapping.telefone !== SKIP && campanhaId;

  return (
    <div className="space-y-6">
      {/* ===== Drop zone ===== */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInput.current?.click()}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          dragOver
            ? "border-foreground bg-foreground/[0.04] scale-[1.01]"
            : "border-border/80 hover:border-foreground/40 hover:bg-accent/30"
        }`}
      >
        {/* decorative wave */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-foreground/[0.025] to-transparent" />

        <input
          ref={fileInput}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="hidden"
        />
        {file ? (
          <div className="relative flex flex-col items-center gap-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-base">{file.name}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground mt-1">
                {sheets.length} aba(s) · <strong className="text-foreground">{totalSelectedLeads}</strong> leads selecionados
              </p>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted ring-1 ring-border transition-transform group-hover:scale-110">
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-display text-2xl tracking-tight">
                Solta a planilha <span className="italic">aqui</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                ou clica pra escolher · <span className="font-mono">.xlsx</span> ·{" "}
                <span className="font-mono">.xls</span> · <span className="font-mono">.csv</span> · múltiplas abas suportadas
              </p>
            </div>
          </div>
        )}
      </div>

      {file && sheets.length > 0 && (
        <>
          {/* ===== Sheets picker ===== */}
          {sheets.length > 1 && (
            <Section title="Abas da planilha" subtitle={`Marque quais importar — total ${totalSelectedLeads} leads`}>
              <div className="flex items-center justify-end gap-2 mb-3">
                <Button type="button" size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => toggleAllSheets(true)}>
                  Selecionar todas
                </Button>
                <Button type="button" size="sm" variant="outline" className="rounded-full h-8 text-xs" onClick={() => toggleAllSheets(false)}>
                  Limpar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {sheets.map((sheet, idx) => {
                  const count = sheet.rows.slice(sheet.headerRow + 1).filter((row) =>
                    row.some((c) => c !== null && c !== undefined && String(c).trim() !== "")
                  ).length;
                  const isPreview = idx === previewSheetIdx;
                  return (
                    <label
                      key={idx}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        sheet.selected
                          ? "border-foreground/30 bg-card shadow-sm"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={sheet.selected}
                        onChange={() => toggleSheet(idx)}
                        className="w-4 h-4 rounded accent-foreground"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sheet.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
                          {count} leads
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setPreviewSheetIdx(idx); }}
                        className={`text-[10px] font-mono uppercase tracking-[0.18em] px-2.5 py-1 rounded-full ${
                          isPreview
                            ? "bg-foreground text-background"
                            : "bg-background border border-border hover:border-foreground/40"
                        }`}
                      >
                        {isPreview ? "Vendo" : "Ver"}
                      </button>
                    </label>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ===== Header row picker ===== */}
          {currentSheet && (
            <Section
              title="Linha do cabeçalho"
              subtitle={`Aba "${currentSheet.name}" — detectado na linha ${currentSheet.headerRow + 1}`}
            >
              <div className="flex items-end gap-4">
                <div className="space-y-1.5 w-28">
                  <Label className="text-xs">Linha</Label>
                  <Input
                    type="number"
                    min={1}
                    max={currentSheet.rows.length}
                    value={currentSheet.headerRow + 1}
                    onChange={(e) => changeHeaderRow(previewSheetIdx, e.target.value)}
                    className="h-10 font-mono"
                  />
                </div>
                <div className="flex-1 text-xs text-muted-foreground bg-muted/40 px-4 py-3 rounded-lg border border-border/60 self-stretch flex items-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] mr-3 text-foreground/70">Conteúdo</span>
                  <span className="truncate">{headers.join(" · ")}</span>
                </div>
              </div>
            </Section>
          )}

          {/* ===== Mapeamento ===== */}
          <Section
            title="Mapeamento de colunas"
            subtitle="Aplicado a TODAS as abas selecionadas (mesmo formato)"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <MapField label="Nome" required value={mapping.nome} onChange={(v) => setMapping({ ...mapping, nome: v })} headers={headers} />
              <MapField label="Telefone" required value={mapping.telefone} onChange={(v) => setMapping({ ...mapping, telefone: v })} headers={headers} />
              <MapField label="Grau (A / B / C1)" value={mapping.grau} onChange={(v) => setMapping({ ...mapping, grau: v })} headers={headers} />
              <MapField label="De onde conhece / Recomendação" value={mapping.veioDeRecomendacao} onChange={(v) => setMapping({ ...mapping, veioDeRecomendacao: v })} headers={headers} />
              <MapField label="Quem recomendou" value={mapping.quemRecomendou} onChange={(v) => setMapping({ ...mapping, quemRecomendou: v })} headers={headers} />
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">DDD padrão <span className="font-normal text-muted-foreground">(telefones sem DDD)</span></Label>
                <Input
                  type="text"
                  placeholder="67"
                  maxLength={2}
                  value={dddDefault}
                  onChange={(e) => setDddDefault(e.target.value.replace(/\D/g, ""))}
                  className="h-10 font-mono"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-medium">
                  Campanha de destino <span className="text-[oklch(0.65_0.18_70)]">*</span>
                </Label>
                <Select value={campanhaId} onValueChange={(v: string | null) => setCampanhaId(v ?? "")}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Escolha a campanha" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
                    {campanhas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>

          {/* ===== Preview ===== */}
          {currentSheet && (
            <Section
              title="Pré-visualização"
              subtitle={`Primeiras 5 linhas — aba "${currentSheet.name}"`}
            >
              <div className="overflow-x-auto rounded-xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/30">
                      {headers.map((h, i) => (
                        <TableHead key={i} className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((row, i) => (
                      <TableRow key={i} className="border-border/40">
                        {headers.map((_, j) => (
                          <TableCell key={j} className="text-xs">{String(row[j] ?? "")}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>
          )}

          {/* ===== Result message ===== */}
          {result && (
            <div className={`flex items-start gap-2 px-4 py-3 rounded-xl text-sm border ${
              result.ok
                ? "bg-emerald-500/8 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                : "bg-destructive/8 text-destructive border-destructive/30"
            }`}>
              {result.ok ? <Check className="w-4 h-4 mt-0.5 shrink-0" /> : <X className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{result.message}</span>
            </div>
          )}

          {/* ===== Sticky bottom action bar ===== */}
          <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-full border border-border/80 bg-card/90 px-5 py-3 shadow-lg backdrop-blur">
            <div className="text-sm">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground mr-2">Pronto pra subir</span>
              <span className="font-display text-lg tracking-tight">{totalSelectedLeads}</span>
              <span className="text-muted-foreground"> leads</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setFile(null); setSheets([]); setResult(null); }}
                className="rounded-full h-9 px-4"
              >
                Cancelar
              </Button>
              <Button
                onClick={submit}
                disabled={!canSubmit || loading}
                className="rounded-full h-9 px-5 bg-foreground text-background hover:bg-foreground/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Importar
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6">
      <div className="mb-5">
        <h3 className="font-display text-xl tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function MapField({
  label,
  value,
  onChange,
  headers,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  headers: string[];
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-[oklch(0.65_0.18_70)]">*</span>}
      </Label>
      <Select value={value} onValueChange={(v: string | null) => onChange(v ?? SKIP)}>
        <SelectTrigger className="h-10 w-full">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent className="min-w-[var(--radix-select-trigger-width)]">
          <SelectItem value={SKIP}>— não usar —</SelectItem>
          {headers.map((h, i) => <SelectItem key={i} value={h}>{h}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
