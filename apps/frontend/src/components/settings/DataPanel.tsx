"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Braces, FileText, RefreshCw, Trash2 } from "lucide-react";
import clsx from "clsx";
import type { Conversation } from "@sahayak/shared";
import { useRouter } from "@/i18n/navigation";
import { useChatContext } from "@/components/chat/ChatProvider";
import { clearHistory, syncFromServer, useHistory } from "@/lib/history";
import { conversationToMarkdown, downloadText, exportFilename } from "@/lib/export";
import { formatNumber } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { Button } from "@/components/ui/Button";
import { SettingsSection } from "./SettingsSection";

type Busy = "json" | "markdown" | "sync" | "delete" | null;

/** Pulls the signed-in user's conversations; throws on anything but 200. */
async function fetchAll(): Promise<Conversation[]> {
  const res = await fetch("/api/conversations", { cache: "no-store" });
  if (!res.ok) throw new Error(`conversations ${res.status}`);
  const data = (await res.json()) as { conversations?: Conversation[] };
  return data.conversations ?? [];
}

/**
 * Settings › Data. Exports are built in the browser from the server copy;
 * the storage card compares this device with the server; delete-all is a
 * typed confirmation followed by one DELETE per conversation (the backend
 * has no bulk route by design).
 */
export function DataPanel({ serverCount }: { serverCount: number | null }) {
  const t = useTranslations("settings.data");
  const tc = useTranslations("chat");
  const tApp = useTranslations("app");
  const tUi = useTranslations("ui");
  const locale = useLocale();
  const router = useRouter();
  const confirm = useConfirm();
  const chat = useChatContext();
  const local = useHistory();
  const [busy, setBusy] = useState<Busy>(null);

  const exportAs = async (kind: "json" | "markdown") => {
    setBusy(kind);
    try {
      const list = await fetchAll();
      if (list.length === 0) {
        toast.info(t("nothingToExport"));
        return;
      }
      if (kind === "json") {
        downloadText(exportFilename("conversations", "json"), JSON.stringify(list, null, 2), "application/json;charset=utf-8");
      } else {
        const labels = {
          you: tc("you"),
          assistant: tc("assistant"),
          sources: tc("sources"),
          verified: tc("verified"),
          unverified: tc("unverified"),
          notice: tApp("notice"),
        };
        const body = list.map((conv) => conversationToMarkdown(conv, labels)).join("\n---\n\n");
        downloadText(exportFilename("conversations"), `# ${tApp("name")}\n\n${body}`);
      }
      toast.success(t("exported"));
    } catch {
      toast.error(t("exportFailed"));
    } finally {
      setBusy(null);
    }
  };

  const resync = async () => {
    setBusy("sync");
    try {
      await syncFromServer();
      toast.success(t("resynced"));
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const deleteAll = async () => {
    const ok = await confirm({
      title: t("deleteAll"),
      body: t("deleteAllBody"),
      destructive: true,
      confirmLabel: tUi("delete"),
      typeToConfirm: "DELETE",
      typeToConfirmHint: t("typeToConfirm"),
    });
    if (!ok) return;
    setBusy("delete");
    try {
      const list = await fetchAll();
      const results = await Promise.all(
        list.map((c) =>
          fetch(`/api/conversations?id=${encodeURIComponent(c.id)}`, { method: "DELETE" })
            .then((r) => r.ok)
            .catch(() => false),
        ),
      );
      clearHistory();
      chat.reset();
      if (results.every(Boolean)) toast.success(t("deleted"));
      else toast.error(t("deleteFailed"));
      router.refresh();
    } catch {
      toast.error(t("deleteFailed"));
    } finally {
      setBusy(null);
    }
  };

  const counts = [
    { key: "onDevice", value: local.length },
    { key: "onServer", value: serverCount },
  ] as const;

  return (
    <>
      <SettingsSection title={t("export")} description={t("exportBody")}>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void exportAs("markdown")} loading={busy === "markdown"} disabled={busy !== null && busy !== "markdown"}>
            <FileText size={15} strokeWidth={1.75} aria-hidden />
            {t("downloadMarkdown")}
          </Button>
          <Button onClick={() => void exportAs("json")} loading={busy === "json"} disabled={busy !== null && busy !== "json"}>
            <Braces size={15} strokeWidth={1.75} aria-hidden />
            {t("downloadJson")}
          </Button>
        </div>
      </SettingsSection>

      <SettingsSection
        title={t("storage")}
        description={t("storageBody")}
        actions={
          <Button size="sm" onClick={() => void resync()} loading={busy === "sync"} disabled={busy !== null && busy !== "sync"}>
            <RefreshCw size={14} strokeWidth={1.75} aria-hidden />
            {t("resync")}
          </Button>
        }
      >
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-rule-strong bg-rule-strong sm:grid-cols-2">
          {counts.map(({ key, value }) => (
            <div key={key} className="flex flex-col bg-sheet p-4">
              <dt className="text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">{t(key)}</dt>
              <dd className={clsx("mt-1.5 text-2xl font-medium leading-none tabular-nums", value === null ? "text-ink-3" : "text-ink")}>
                {value === null ? "—" : formatNumber(value, locale)}
              </dd>
              {value !== null && <dd className="mt-1.5 text-xs text-ink-2">{t("conversations", { count: value, n: formatNumber(value, locale) })}</dd>}
            </div>
          ))}
        </dl>
      </SettingsSection>

      <SettingsSection title={t("danger")} description={t("deleteAllBody")} danger>
        <Button variant="destructive" onClick={() => void deleteAll()} loading={busy === "delete"} disabled={busy !== null && busy !== "delete"}>
          <Trash2 size={15} strokeWidth={1.75} aria-hidden />
          {t("deleteAll")}
        </Button>
      </SettingsSection>
    </>
  );
}
