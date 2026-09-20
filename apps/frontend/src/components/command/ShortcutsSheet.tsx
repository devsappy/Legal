"use client";

import { useTranslations } from "next-intl";
import { Dialog } from "@/components/ui/Dialog";
import { Kbd } from "@/components/ui/Kbd";
import { groupShortcuts, useShortcutList } from "@/lib/shortcuts";

/**
 * Every shortcut currently registered through useHotkey, grouped by scope.
 * Tables, drawers and the chat composer register their own keys while
 * mounted, so the list reflects the page the user is on.
 */
export function ShortcutsList() {
  const t = useTranslations("shortcuts");
  const groups = groupShortcuts(useShortcutList());

  if (groups.length === 0) return <p className="text-sm text-ink-2">{t("empty")}</p>;

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.scope} aria-labelledby={`shortcuts-${group.scope}`}>
          <h3 id={`shortcuts-${group.scope}`} className="mb-2 text-2xs font-medium uppercase tracking-[0.08em] text-ink-3">
            {t(`scopes.${group.scope}`)}
          </h3>
          <ul className="divide-y divide-rule rounded-lg border border-rule bg-sheet">
            {group.items.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-ink">{s.label}</span>
                <Kbd combo={s.combo} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ShortcutsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("shortcuts");
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={t("title")} description={t("description")} size="md">
      <ShortcutsList />
    </Dialog>
  );
}
