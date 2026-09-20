import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, ArrowUp, Link2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, buttonClasses } from "@/components/ui";
import { LEGAL_UPDATED, headingId, otherLegal, type LegalKind } from "@/lib/legal";
import { TocSpy } from "./TocSpy";

const ARTICLE_ID = "legal-article";
const TOC_ID = "legal-toc";

/**
 * One layout for the privacy policy and the terms of use, driven by the
 * `legal.<kind>` messages: a sticky "On this page" list (hidden in print),
 * numbered sections with hover anchors, the dated <time>, an "Also read"
 * card linking the other document and a contact line. The public header
 * and footer come from the (public) layout.
 */
export async function LegalArticle({ kind }: { kind: LegalKind }) {
  const t = await getTranslations();
  const format = await getFormatter();
  const sections = t.raw(`legal.${kind}.sections`) as { heading: string; body: string }[];
  const ids = sections.map((s, i) => headingId(s.heading, i));
  const other = otherLegal(kind);
  const updated = format.dateTime(new Date(`${LEGAL_UPDATED}T00:00:00+05:30`), {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
    numberingSystem: "latn",
  });

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-8 sm:py-14 lg:grid lg:grid-cols-[220px_minmax(0,72ch)] lg:justify-center lg:gap-x-16">
      <nav
        id={TOC_ID}
        aria-label={t("legal.onThisPage")}
        data-print="hide"
        className="mb-10 lg:sticky lg:top-24 lg:mb-0 lg:self-start"
      >
        <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{t("legal.onThisPage")}</p>
        <ol className="mt-3 border-l border-rule">
          {sections.map((s, i) => (
            <li key={ids[i]}>
              <a
                href={`#${ids[i]}`}
                className="-ml-px flex items-baseline gap-2 border-l border-transparent py-1.5 pl-3 pr-2 text-sm text-ink-2 transition-colors hover:text-ink aria-[current=location]:border-ink aria-[current=location]:font-medium aria-[current=location]:text-ink"
              >
                <span className="font-mono text-2xs tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
                <span className="min-w-0">{s.heading}</span>
              </a>
            </li>
          ))}
        </ol>
        <TocSpy article={ARTICLE_ID} nav={TOC_ID} />
      </nav>

      <article id={ARTICLE_ID} className="min-w-0 scroll-mt-24">
        <p className="font-mono text-2xs uppercase tracking-[0.12em] text-ink-3">{t("legal.eyebrow")}</p>
        <h1 className="mt-2 text-3xl font-medium text-ink text-balance">{t(`legal.${kind}.title`)}</h1>
        <p className="mt-3 text-sm text-ink-3">
          {t.rich("legal.updated", {
            date: updated,
            time: (chunks) => (
              <time dateTime={LEGAL_UPDATED} className="text-ink-2">
                {chunks}
              </time>
            ),
          })}
        </p>

        {sections.map((s, i) => (
          <section key={ids[i]} aria-labelledby={ids[i]} className="mt-10 border-t border-rule pt-8 first-of-type:mt-8">
            <h2 id={ids[i]} className="group flex items-baseline gap-3 scroll-mt-24 text-xl font-medium text-ink">
              <span className="font-mono text-sm font-normal tabular-nums text-ink-3">{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0">{s.heading}</span>
              <a
                href={`#${ids[i]}`}
                aria-label={t("legal.anchor")}
                className="ml-1 inline-flex size-6 shrink-0 items-center justify-center self-center rounded-md text-ink-3 opacity-0 transition-opacity hover:bg-muted hover:text-ink focus-visible:opacity-100 group-hover:opacity-100 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                data-print="hide"
              >
                <Link2 size={14} strokeWidth={2} aria-hidden />
              </a>
            </h2>
            <p className="mt-3 text-base leading-[1.65] text-ink-2 whitespace-pre-line">{s.body}</p>
          </section>
        ))}

        <div className="mt-12" data-print="hide">
          <Card as="section">
            <CardHeader as="h2" title={t("legal.alsoRead")} description={t("legal.alsoReadBody")} className="mb-3" />
            <Link href={`/${other}`} className={buttonClasses("outline", "sm", "group")}>
              {t(`legal.${other}.title`)}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none [html[data-motion=reduced]_&]:transition-none"
                aria-hidden
              />
            </Link>
          </Card>
        </div>

        <p className="mt-8 text-sm text-ink-3">{t("legal.contact")}</p>

        <p className="mt-6" data-print="hide">
          <a href={`#${ARTICLE_ID}`} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
            <ArrowUp size={14} aria-hidden /> {t("legal.backToTop")}
          </a>
        </p>
      </article>
    </div>
  );
}
