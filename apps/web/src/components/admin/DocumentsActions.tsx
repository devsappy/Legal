"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { RefreshCw, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { JURISDICTIONS } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

/** Upload an Act (PDF, Markdown or text) and rebuild the retrieval index. */
export function DocumentsActions() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [jurisdiction, setJurisdiction] = useState(JURISDICTIONS[0].id);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"upload" | "reindex" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || busy) return;
    setBusy("upload");
    setMessage(null);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("jurisdiction", jurisdiction);
    fd.set("title", title);
    const res = await fetch("/api/admin/documents", { method: "POST", body: fd }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; sections?: number; detail?: string } | null;
    setBusy(null);
    if (data?.ok) {
      setMessage(t("uploaded", { count: data.sections ?? 0 }));
      setOpen(false);
      setTitle("");
      setFile(null);
      router.refresh();
    } else {
      setMessage(t("uploadFailed") + (data?.detail ? ` — ${data.detail}` : ""));
    }
  };

  const reindex = async () => {
    if (busy) return;
    setBusy("reindex");
    setMessage(null);
    const res = await fetch("/api/admin/reindex", { method: "POST" }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { ok?: boolean; embedded?: number; seconds?: number; note?: string } | null;
    setBusy(null);
    setMessage(
      data?.ok
        ? t("reindexed", { count: data.embedded ?? 0, seconds: data.seconds ?? 0 }) + (data.note ? ` (${data.note})` : "")
        : t("reindexFailed"),
    );
    router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={reindex} disabled={busy !== null}>
          <RefreshCw size={14} className={busy === "reindex" ? "animate-spin" : undefined} /> {t("reindex")}
        </Button>
        <Button variant="primary" onClick={() => setOpen((o) => !o)} disabled={busy !== null}>
          <Upload size={14} /> {t("upload")}
        </Button>
      </div>
      {message && <p className="text-[13px] text-ink-2">{message}</p>}
      {open && (
        <form onSubmit={upload} className="rounded-lg border border-rule bg-sheet p-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end">
          <label className="block text-[12.5px] text-ink-2">
            {t("actTitle")}
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Maharashtra Co-operative Societies Act, 1960"
              className="mt-1 h-9 w-full rounded-md border border-rule bg-sheet px-3 text-[14px] text-ink"
            />
          </label>
          <label className="block text-[12.5px] text-ink-2">
            {t("columns.jurisdiction")}
            <div className="mt-1">
              <Select
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                options={JURISDICTIONS.map((j) => ({ value: j.id, label: j.name }))}
                size="md"
                className="w-full"
              />
            </div>
          </label>
          <label className="block text-[12.5px] text-ink-2">
            {t("file")}
            <input
              required
              type="file"
              accept=".pdf,.md,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block text-[13px] file:mr-3 file:h-9 file:rounded-md file:border file:border-rule file:bg-sheet file:px-3 file:text-[13px]"
            />
          </label>
          <div className="sm:col-span-3 flex items-center gap-2">
            <Button type="submit" variant="primary" disabled={!file || busy !== null}>
              {busy === "upload" ? t("uploading") : t("upload")}
            </Button>
            <span className="text-[12px] text-ink-3">{t("uploadHint")}</span>
          </div>
        </form>
      )}
    </div>
  );
}
