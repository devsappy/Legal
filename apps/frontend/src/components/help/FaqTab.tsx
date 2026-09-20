"use client";

import { useTranslations } from "next-intl";
import { Disclosure } from "@/components/ui/Disclosure";

type Item = { q: string; a: string };

/** The landing page's FAQ plus a few in-app questions, as one exclusive accordion. */
export function FaqTab() {
  const landing = useTranslations("landing.faq");
  const help = useTranslations("help.faq");
  const items = [...(landing.raw("items") as Item[]), ...(help.raw("extra") as Item[])];

  return (
    <div className="-mt-1">
      {items.map((item, i) => (
        <Disclosure key={item.q} title={item.q} name="help-faq" id={`help-faq-${i}`} defaultOpen={i === 0}>
          {item.a}
        </Disclosure>
      ))}
    </div>
  );
}
