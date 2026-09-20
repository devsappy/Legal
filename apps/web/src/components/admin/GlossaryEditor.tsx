"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import type { GlossaryRow } from "@/lib/db";
import { Button } from "@/components/ui/Button";

const FIELDS = ["term", "hi", "mr", "ta", "source"] as const;
type Draft = Record<(typeof FIELDS)[number], string>;
const EMPTY: Draft = { term: "", hi: "", mr: "", ta: "", source: "" };

/** Editable glossary table: add, edit in place, delete. */
export function GlossaryEditor({ rows }: { rows: GlossaryRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const call = async (method: string, body?: unknown, query = "") => {
    setBusy(true);
    await fetch(`/api/admin/glossary${query}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    }).catch(() => null);
    setBusy(false);
    router.refresh();
  };

  const headers = [t("columns.term"), "हिन्दी", "मराठी", "தமிழ்", t("columns.source"), ""];
  const input = (field: keyof Draft) => (
    <input
      value={draft[field]}
      onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
      className="h-8 w-full rounded-md border border-rule bg-sheet px-2 text-[13px] text-ink"
    />
  );
  const editRow = (id: number | null, onSave: () => Promise<void>) => (
    <tr key={id ?? "new"} className="border-b border-rule bg-muted/40">
      {FIELDS.map((f) => (
        <td key={f} className="px-2 py-2">
          {input(f)}
        </td>
      ))}
      <td className="px-2 py-2 whitespace-nowrap text-right">
        <Button size="sm" variant="primary" disabled={busy || !draft.term.trim()} onClick={onSave}>
          <Check size={13} /> {t("save")}
        </Button>{" "}
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setAdding(false);
            setEditing(null);
          }}
        >
          <X size={13} />
        </Button>
      </td>
    </tr>
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setAdding(true);
            setEditing(null);
            setDraft(EMPTY);
          }}
        >
          <Plus size={14} /> {t("addTerm")}
        </Button>
      </div>
      <div className="rounded-lg border border-rule bg-sheet overflow-x-auto">
        <table className="w-full text-[13.5px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-3 border-b border-rule">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2.5 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {adding && editRow(null, () => call("POST", draft).then(() => setAdding(false)))}
            {rows.length === 0 && !adding ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-ink-3">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              rows.map((r) =>
                editing === r.id ? (
                  editRow(r.id, () => call("PUT", { id: r.id, ...draft }).then(() => setEditing(null)))
                ) : (
                  <tr key={r.id} className="border-b border-rule last:border-b-0 hover:bg-muted/60">
                    <td className="px-3 py-2.5 text-ink font-medium">{r.term}</td>
                    <td className="px-3 py-2.5">{r.hi}</td>
                    <td className="px-3 py-2.5">{r.mr}</td>
                    <td className="px-3 py-2.5">{r.ta}</td>
                    <td className="px-3 py-2.5 font-mono text-[12.5px]">{r.source}</td>
                    <td className="px-2 py-2 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={t("edit")}
                        onClick={() => {
                          setAdding(false);
                          setEditing(r.id);
                          setDraft({ term: r.term, hi: r.hi, mr: r.mr, ta: r.ta, source: r.source });
                        }}
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button size="sm" variant="ghost" aria-label={t("delete")} disabled={busy} onClick={() => call("DELETE", undefined, `?id=${r.id}`)}>
                        <Trash2 size={13} />
                      </Button>
                    </td>
                  </tr>
                ),
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
