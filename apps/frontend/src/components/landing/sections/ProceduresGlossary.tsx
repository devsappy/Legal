import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { ArrowRight, ListChecks } from "lucide-react";
import { type Checklist, JURISDICTIONS, pick } from "@sahayak/shared";
import { Link } from "@/i18n/navigation";
import { GLOSSARY } from "@/lib/mock-data";
import { loginHref } from "@/lib/routes";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/landing/Reveal";

const SECTION = "relative mx-auto w-full max-w-[1400px] scroll-mt-[80px] px-4 py-16 sm:px-8 sm:py-24";
const KICKER = "text-[12px] font-semibold uppercase tracking-[0.12em] text-ink-3";
const H2 = "mt-3 text-[clamp(26px,3vw,36px)] font-semibold leading-[1.1] tracking-[-0.03em] text-ink";
const BOX = "grid gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const CELL = "cell bg-sheet p-5 sm:p-6";

type Props = {
  /** null when the backend did not answer; [] when it answered with nothing. */
  procedures: Checklist[] | null;
  locale: string;
};

/**
 * Step-by-step guides (each card a link into the app, inverting on hover
 * and focus) beside the four-language glossary sample. A backend that is
 * down renders one empty-state cell with a sign-in link, never a hole.
 */
export async function ProceduresGlossary({ procedures, locale }: Props) {
  const t = await getTranslations();
  const terms = GLOSSARY.slice(0, 5);
  const list = procedures ?? [];

  return (
    <section id="procedures" className={SECTION}>
      <Reveal className={clsx(BOX, "lg:grid-cols-[2fr_1fr]")}>
        <div className="grid gap-px bg-rule-strong">
          <div className={CELL}>
            <p className={KICKER}>{t("nav.checklists")}</p>
            <h2 className={H2}>{t("landing.procedures.title")}</h2>
            <p className="mt-2 max-w-[60ch] text-base text-ink-2">{t("landing.procedures.body")}</p>
          </div>
          {list.length === 0 ? (
            <div className="bg-sheet">
              <EmptyState
                icon={<ListChecks size={18} strokeWidth={1.75} />}
                tone={procedures === null ? "error" : "neutral"}
                title={t("landing.procedures.empty")}
                description={t("landing.procedures.emptyBody")}
                action={
                  <Link href={loginHref("/checklists")} className={buttonClasses("outline", "sm")}>
                    {t("landing.procedures.emptyAction")}
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="grid gap-px bg-rule-strong sm:grid-cols-2" data-stagger>
              {list.map((c) => {
                const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);
                return (
                  <li key={c.slug} className="flex bg-sheet">
                    <Link
                      href={loginHref(`/checklists/${c.slug}`)}
                      className="cell-link group flex w-full flex-col bg-sheet p-5 sm:p-6"
                      style={{ outlineOffset: -2 }}
                    >
                      <span className="font-mono text-2xs text-ink-3">
                        {j?.short} · {t("landing.procedures.steps", { count: c.steps.length })}
                      </span>
                      <h3 className="mt-3 text-[16.5px] font-semibold tracking-tight text-ink">{pick(c.title, locale)}</h3>
                      <p className="mt-1.5 flex-1 text-sm leading-[1.55] text-ink-2">{pick(c.summary, locale)}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-ink-2">
                        {t("landing.procedures.open")}
                        <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div id="glossary" className={clsx(CELL, "flex scroll-mt-[80px] flex-col")}>
          <p className={KICKER}>{t("admin.glossary")}</p>
          <h2 className="mt-3 text-[22px] font-semibold tracking-tight text-ink">{t("landing.glossary.title")}</h2>
          <p className="mt-2 text-sm text-ink-2">{t("landing.glossary.body")}</p>
          <table className="mt-5 w-full border-t border-rule-strong text-sm">
            <tbody>
              {terms.map((g) => (
                <tr key={g.term} className="border-b border-rule align-top">
                  <th scope="row" className="whitespace-nowrap py-2.5 pr-3 text-left font-semibold text-ink">
                    {g.term}
                  </th>
                  <td className="py-2.5 text-ink-2">
                    <span lang="hi">{g.hi}</span> · <span lang="mr">{g.mr}</span> · <span lang="ta">{g.ta}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </section>
  );
}
