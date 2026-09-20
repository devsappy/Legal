/**
 * Copies text to the clipboard. The async Clipboard API needs a secure
 * context and a user gesture; the hidden-textarea fallback covers plain
 * http on a LAN, which is how the pilot is often reached. Resolves false
 * when neither route worked so the caller can say so.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || typeof document === "undefined") return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.opacity = "0";
    ta.style.pointerEvents = "none";
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Strips [n] citation markers so copied or spoken text reads cleanly. */
export function stripCitations(text: string): string {
  return text.replace(/\s?\[\d{1,2}\]/g, "");
}
