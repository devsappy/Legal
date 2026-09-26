import { getTranslations } from "next-intl/server";
import clsx from "clsx";
import { Check, X } from "lucide-react";

type Verdict = "yes" | "no" | "partly";
type Row = { label: string; cells: Verdict[] };

function Mark({ value, labels }: { value: Verdict; labels: Record<Verdict, string> }) {
  const label = labels[value];
  if (value === "yes") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm bg-ink text-paper" aria-hidden>
          <Check size={13} strokeWidth={2.5} />
        </span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  if (value === "no") {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-rule-strong text-ink-3" aria-hidden>
          <X size={13} strokeWidth={2.5} />
        </span>
        <span className="sr-only">{label}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      {/* Half-filled square: the left border is the fill. */}
      <span className="inline-block size-5 shrink-0 rounded-sm border border-rule-strong border-l-[10px] border-l-ink" aria-hidden />
      <span className="font-mono text-2xs uppercase tracking-wide text-ink-2">{label}</span>
    </span>
  );
}

/**
 * A real table (caption for readers, row headers, three columns) so the
 * comparison is navigable cell by cell. The first data column carries a
 * brand-soft tint; "partly" is used wherever the pipeline only partly
 * backs the claim. On phones the table scrolls sideways under a sticky
 * label column.
 */
export async function CompareTable() {
  const t = await getTranslations("landing.compare");
  const columns = t.raw("columns") as string[];
  const rows = t.raw("rows") as Row[];
  const labels: Record<Verdict, string> = { yes: t("yes"), no: t("no"), partly: t("partly") };

  // `relative` keeps the cells' sr-only labels (absolutely positioned) inside
  // this scroll box, so they cannot widen the page on phones.
  return (
    <div
      role="region"
      aria-label={t("title")}
      tabIndex={0}
      className="scroll-thin relative overflow-x-auto rounded-md border border-rule-strong bg-sheet"
    >
      <table className="w-full min-w-[520px] border-collapse text-sm sm:min-w-[600px]">
        <caption className="sr-only">{t("title")}</caption>
        <thead>
          <tr className="border-b border-rule-strong">
            <th scope="col" className="sticky left-0 z-10 w-[140px] min-w-[132px] border-r border-rule bg-sheet px-3 py-3 text-left sm:w-[280px] sm:min-w-[180px] sm:px-5">
              <span className="sr-only">{t("title")}</span>
            </th>
            {columns.map((c, i) => (
              <th
                key={c}
                scope="col"
                className={clsx(
                  "px-3 py-3 text-left text-sm font-semibold text-ink sm:px-5",
                  i === 0 ? "bg-brand-soft" : "text-ink-2",
                )}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-rule last:border-b-0">
              <th scope="row" className="sticky left-0 z-10 border-r border-rule bg-sheet px-3 py-3 text-left text-sm font-medium leading-snug text-ink sm:px-5">
                {r.label}
              </th>
              {r.cells.map((cell, i) => (
                <td key={i} className={clsx("px-3 py-3 align-middle sm:px-5", i === 0 && "bg-brand-soft")}>
                  <Mark value={cell} labels={labels} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
