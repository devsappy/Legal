import type { Conversation } from "@sahayak/shared";

/**
 * Conversation export. The Markdown builder used to live inside AppShell's
 * export button; it is here so the sidebar menu, the top bar and the command
 * palette all produce the same file.
 */
export type ExportLabels = {
  you: string;
  assistant: string;
  sources: string;
  verified: string;
  unverified: string;
  /** Optional header lines: the app name, "Answering from" and the Act, and the not-legal-advice notice. */
  title?: string;
  answeringFrom?: string;
  act?: string;
  notice?: string;
};

export function conversationToMarkdown(conv: Conversation, labels: ExportLabels): string {
  const lines: string[] = [];
  lines.push(`# ${labels.title ?? conv.title}`, "");
  if (labels.title && conv.title) lines.push(`## ${conv.title}`, "");
  if (labels.answeringFrom && labels.act) lines.push(`${labels.answeringFrom} ${labels.act}`, "");

  for (const m of conv.messages) {
    if (m.status === "streaming" || (m.status === "error" && !m.text.trim())) continue;
    const who = m.role === "user" ? labels.you : labels.assistant;
    lines.push(`**${who}:** ${m.text.trim()}`, "");
    if (m.citations.length) {
      lines.push(`${labels.sources}:`);
      for (const c of m.citations) {
        const mark = c.verified ? labels.verified : labels.unverified;
        lines.push(`- [${c.id}] ${c.act} §${c.section} — ${c.title} (${mark})`);
      }
      lines.push("");
    }
  }

  if (labels.notice) lines.push(`_${labels.notice}_`);
  return lines.join("\n").trimEnd() + "\n";
}

/** File name for an export: "sahayak-2026-09-20.md", or with a slug of the title when given. */
export function exportFilename(title?: string, ext = "md"): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = (title ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return slug ? `sahayak-${date}-${slug}.${ext}` : `sahayak-${date}.${ext}`;
}

/** Triggers a download of `text` from the browser; no-op on the server. */
export function downloadText(filename: string, text: string, mime = "text/markdown;charset=utf-8"): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
