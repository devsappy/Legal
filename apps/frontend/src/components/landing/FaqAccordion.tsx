"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Disclosure } from "@/components/ui/Disclosure";
import { loginHref } from "@/lib/routes";

export type FaqItem = { q: string; a: string };

/** Items are `#faq-1` … so a question can be linked to directly. */
const PREFIX = "faq-";

/**
 * The eight questions on the Disclosure primitive (native <details>) sharing
 * one `name`, so opening one closes the rest. A URL hash such as #faq-3
 * opens and scrolls to that item on arrival and whenever the hash changes.
 */
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const t = useTranslations("landing.faq");
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const openFromHash = () => {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash.startsWith(PREFIX)) return;
      const el = root.current?.querySelector<HTMLDetailsElement>(`details[id="${CSS.escape(hash)}"]`);
      if (!el) return;
      el.open = true;
      el.scrollIntoView({ block: "start" });
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return (
    <div ref={root} className="rounded-md border border-rule-strong bg-sheet px-5 sm:px-6">
      {items.map((item, i) => (
        <Disclosure
          key={item.q}
          id={`${PREFIX}${i + 1}`}
          name="faq"
          className="scroll-mt-[88px]"
          title={
            <span className="flex items-baseline gap-3">
              <span className="w-6 shrink-0 font-mono text-2xs text-ink-3" aria-hidden>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-base font-medium tracking-tight text-ink">{item.q}</span>
            </span>
          }
        >
          <p className="max-w-[70ch] pl-9 text-sm leading-relaxed text-ink-2">{item.a}</p>
        </Disclosure>
      ))}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 py-4 text-sm text-ink-2">
        <span>{t("stillTitle")}</span>
        <Link href={loginHref("/ask")} className="group inline-flex items-center gap-1 font-medium text-ink">
          {t("stillLink")}
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
      </p>
    </div>
  );
}
