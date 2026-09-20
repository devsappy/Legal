import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { type Checklist, JURISDICTIONS, pick } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { buttonClasses } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrintButton } from "@/components/checklists/PrintButton";
import { ProcedureNav, type Neighbour } from "@/components/checklists/ProcedureNav";
import { ProcedureProgress } from "@/components/checklists/ProcedureProgress";
import { ProceduresUnavailable } from "@/components/checklists/ProcedureFilters";
import { StepList, type StepView } from "@/components/checklists/StepList";

type Params = Promise<{ locale: string; slug: string }>;

const fetchProcedure = (slug: string) => backendResult<{ procedure: Checklist }>(`/api/procedures/${encodeURIComponent(slug)}`);

export async function generateMetadata({ params }: { params: Params }) {
  const { locale, slug } = await params;
  const res = await fetchProcedure(slug);
  return { title: res.ok ? pick(res.data.procedure.title, locale) : undefined };
}

export default async function ChecklistPage({ params }: { params: Params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checklists");

  // The siblings list gives prev/next within the same Act; it is optional.
  const [res, all] = await Promise.all([fetchProcedure(slug), backendResult<{ procedures: Checklist[] }>("/api/procedures")]);
  if (!res.ok && res.status === 404) notFound();
  if (!res.ok) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <ProceduresUnavailable title={t("unavailable")} description={t("unavailableBody")} />
      </div>
    );
  }

  const c = res.data.procedure;
  const j = JURISDICTIONS.find((x) => x.id === c.jurisdiction);
  const title = pick(c.title, locale);
  const steps: StepView[] = c.steps.map((s) => ({
    title: pick(s.title, locale),
    detail: pick(s.detail, locale),
    forms: s.forms,
    deadline: s.deadline ? pick(s.deadline, locale) : undefined,
    fee: s.fee ? pick(s.fee, locale) : undefined,
  }));

  let prev: Neighbour | undefined;
  let next: Neighbour | undefined;
  if (all.ok) {
    const siblings = (all.data.procedures ?? []).filter((p) => p.jurisdiction === c.jurisdiction);
    const at = siblings.findIndex((p) => p.slug === c.slug);
    const toNeighbour = (p: Checklist | undefined) => (p ? { slug: p.slug, title: pick(p.title, locale) } : undefined);
    if (at >= 0) {
      prev = toNeighbour(siblings[at - 1]);
      next = toNeighbour(siblings[at + 1]);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <PageHeader
        title={title}
        description={pick(c.summary, locale)}
        eyebrow={`${j?.short ?? c.jurisdiction} · ${t("stepCount", { count: c.steps.length })}`}
        breadcrumbs={[
          { label: t("title"), href: "/checklists" },
          { label: j?.short ?? c.jurisdiction, href: `/checklists?act=${encodeURIComponent(c.jurisdiction)}` },
          { label: title },
        ]}
        actions={
          <>
            <Link href="/checklists" className={buttonClasses("ghost", "sm")} data-print="hide">
              <ArrowLeft size={14} aria-hidden /> {t("back")}
            </Link>
            <PrintButton />
          </>
        }
        className="mb-8"
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <div className="min-w-0">
          <StepList slug={c.slug} procedureTitle={title} jurisdiction={c.jurisdiction} steps={steps} />
          <ProcedureNav prev={prev} next={next} className="mt-10" />
        </div>

        <aside className="self-start rounded-lg border border-rule bg-sheet p-4 text-sm lg:sticky lg:top-4">
          <ProcedureProgress slug={c.slug} total={c.steps.length} />
          <dl className="mt-5 space-y-4 border-t border-rule pt-4">
            <div>
              <dt className="mb-1 text-2xs uppercase tracking-[0.08em] text-ink-3">{t("authority")}</dt>
              <dd className="text-ink">{pick(c.authority, locale)}</dd>
            </div>
            <div>
              <dt className="mb-1 text-2xs uppercase tracking-[0.08em] text-ink-3">{t("basis")}</dt>
              <dd>
                <ul className="ledger -mx-4 px-4 pt-[6px]">
                  {c.basis.map((b) => (
                    <li key={b} className="ledger-line font-mono text-xs text-ink">
                      {b}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
