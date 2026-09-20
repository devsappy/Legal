"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Inbox, RotateCcw } from "lucide-react";
import { JURISDICTIONS, LANGUAGES, type ReviewRow } from "@sahayak/shared";
import { useRouter } from "@/i18n/navigation";
import { reviews as reviewsApi, sqliteDate, type ReviewStatus } from "@/lib/admin-api";
import { formatDateTime, relativeTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import {
  Badge,
  Button,
  DataTable,
  Meter,
  Spinner,
  Tabs,
  Tooltip,
  useTableState,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui";
import { CONFIDENCE_FLOOR, REASON_KIND, ReviewDrawer } from "./ReviewDrawer";

type Tab = "open" | "resolved" | "all";
const TABS: Tab[] = ["open", "resolved", "all"];
const REASONS: ReviewRow["reason"][] = ["low_confidence", "thumbs_down", "no_citation"];

/* ---- ?status= and ?review= as an external store -------------------------- */

/** The same event useTableState fires after it writes the URL, so both re-read together. */
const URL_EVENT = "coop:url";

function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}
const readUrl = () => window.location.search;

function writeParams(patch: Record<string, string | null>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) url.searchParams.delete(k);
    else url.searchParams.set(k, v);
  }
  if (url.href === window.location.href) return;
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(URL_EVENT));
}

type Props = {
  rows: ReviewRow[];
  /** The request's query string ("?status=resolved"), so a deep link renders right on the server. */
  initialSearch?: string;
};

/**
 * The review queue: status tabs with counts, a URL-synced DataTable with
 * filters, search, sort and bulk resolve/reopen, and a detail drawer with
 * keyboard stepping. Rows are local state seeded from the server and
 * re-seeded when the server sends a new array (after router.refresh());
 * status flips apply at once and roll back if the PATCH fails.
 */
export function ReviewQueue({ rows: serverRows, initialSearch = "" }: Props) {
  const t = useTranslations("admin.reviews");
  const tr = useTranslations("admin.reasons");
  const locale = useLocale();
  const router = useRouter();

  /* ---- rows ---- */
  const [prevServer, setPrevServer] = useState(serverRows);
  const [rows, setRows] = useState(serverRows);
  if (serverRows !== prevServer) {
    setPrevServer(serverRows);
    setRows(serverRows);
  }
  const [busy, setBusy] = useState<ReadonlySet<number>>(() => new Set());
  const inflight = useRef(0);

  /* ---- url state ---- */
  const search = useSyncExternalStore(subscribeUrl, readUrl, () => initialSearch);
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const tab: Tab = (TABS as string[]).includes(params.get("status") ?? "") ? (params.get("status") as Tab) : "open";
  const reviewId = Number(params.get("review")) || null;
  const [state, patch] = useTableState({ syncUrl: true });

  const setTab = (next: string) => writeParams({ status: next === "open" ? null : next, page: null });
  const setReview = (id: number | null) => writeParams({ review: id === null ? null : String(id) });

  /* ---- derived lists ---- */
  const counts = useMemo(
    () => ({
      open: rows.filter((r) => r.status === "open").length,
      resolved: rows.filter((r) => r.status === "resolved").length,
      all: rows.length,
    }),
    [rows],
  );
  const visible = useMemo(() => (tab === "all" ? rows : rows.filter((r) => r.status === tab)), [rows, tab]);

  const searchDef = useMemo(
    () => ({
      placeholder: t("search"),
      test: (r: ReviewRow, q: string) => r.question.toLowerCase().includes(q) || r.answer.toLowerCase().includes(q),
    }),
    [t],
  );

  const filters = useMemo<FilterDef<ReviewRow>[]>(
    () => [
      {
        id: "reason",
        label: t("filters.reason"),
        options: REASONS.map((r) => ({ value: r, label: tr(r) })),
        test: (r, v) => v.includes(r.reason),
      },
      {
        id: "language",
        label: t("filters.language"),
        options: LANGUAGES.map((l) => ({ value: l.code, label: l.native })),
        test: (r, v) => v.includes(r.language),
      },
      {
        id: "jurisdiction",
        label: t("filters.jurisdiction"),
        options: JURISDICTIONS.map((j) => ({ value: j.id, label: j.short })),
        test: (r, v) => v.includes(r.jurisdiction),
      },
    ],
    [t, tr],
  );

  const columns = useMemo<ColumnDef<ReviewRow>[]>(() => {
    const cols: ColumnDef<ReviewRow>[] = [
      {
        id: "question",
        header: t("columns.question"),
        width: "38%",
        cell: (r) => (
          <span className="flex items-start gap-2">
            <Tooltip content={r.question}>
              <span className="line-clamp-2 min-w-0 text-ink">{r.question}</span>
            </Tooltip>
            {busy.has(r.id) && <Spinner size={12} className="mt-1 shrink-0 text-ink-3" />}
          </span>
        ),
      },
      {
        id: "language",
        header: t("columns.language"),
        hideBelow: "md",
        width: "110px",
        cell: (r) => LANGUAGES.find((l) => l.code === r.language)?.native ?? r.language,
      },
      {
        id: "jurisdiction",
        header: t("columns.jurisdiction"),
        hideBelow: "md",
        cell: (r) => (
          <Badge mono kind="neutral">
            {JURISDICTIONS.find((j) => j.id === r.jurisdiction)?.short ?? r.jurisdiction}
          </Badge>
        ),
      },
      {
        id: "confidence",
        header: t("columns.confidence"),
        width: "150px",
        sortValue: (r) => r.confidence,
        cell: (r) => (
          <span className="flex items-center gap-2">
            <Meter
              value={r.confidence}
              threshold={CONFIDENCE_FLOOR}
              label={t("confidence", { percent: `${Math.round(r.confidence * 100)}%` })}
              className="w-16 shrink-0"
            />
            <span className={`font-mono text-xs tabular-nums ${r.confidence < CONFIDENCE_FLOOR ? "text-seal" : "text-ink-2"}`}>
              {Math.round(r.confidence * 100)}%
            </span>
          </span>
        ),
      },
      {
        id: "reason",
        header: t("columns.reason"),
        cell: (r) => (
          <Badge kind={REASON_KIND[r.reason]} dot>
            {tr(r.reason)}
          </Badge>
        ),
      },
    ];
    if (tab === "all") {
      cols.push({
        id: "status",
        header: t("tabs.label"),
        cell: (r) => <Badge kind={r.status === "resolved" ? "soft" : "solid"}>{t(`status.${r.status}`)}</Badge>,
      });
    }
    cols.push({
      id: "asked",
      header: t("columns.asked"),
      width: "130px",
      mono: true,
      sortValue: (r) => sqliteDate(r.created_at).getTime(),
      cell: (r) => {
        const when = sqliteDate(r.created_at);
        return (
          <Tooltip content={formatDateTime(when, locale)}>
            <time dateTime={when.toISOString()} className="whitespace-nowrap" suppressHydrationWarning>
              {relativeTime(when, locale)}
            </time>
          </Tooltip>
        );
      },
    });
    return cols;
  }, [t, tr, locale, tab, busy]);

  /* The table's own order (search → filters → sort), so ← / → in the drawer follow what is on screen. */
  const navList = useMemo(() => {
    const q = state.q.trim().toLowerCase();
    let out = visible;
    if (q) out = out.filter((r) => searchDef.test(r, q));
    for (const f of filters) {
      const values = state.filters[f.id];
      if (values?.length) out = out.filter((r) => f.test(r, values));
    }
    const col = state.sort ? columns.find((c) => c.id === state.sort && c.sortValue) : undefined;
    if (col?.sortValue) {
      const get = col.sortValue;
      const sign = state.dir === "desc" ? -1 : 1;
      out = out
        .map((r, i) => ({ r, i, v: get(r) }))
        .sort((a, b) => {
          const d = typeof a.v === "number" && typeof b.v === "number" ? a.v - b.v : String(a.v).localeCompare(String(b.v));
          return d * sign || a.i - b.i;
        })
        .map((x) => x.r);
    }
    return out;
  }, [visible, state, searchDef, filters, columns]);

  /* ---- status changes ---- */
  function settle() {
    inflight.current -= 1;
    if (inflight.current === 0) router.refresh();
  }

  const applyStatus = (ids: number[], status: ReviewStatus) =>
    setRows((list) => list.map((r) => (ids.includes(r.id) ? { ...r, status } : r)));

  /** Optimistic flip of every target not already at `to`; Undo runs the reverse flip silently. */
  async function flip(targets: ReviewRow[], to: ReviewStatus, silent = false): Promise<void> {
    const changing = targets.filter((r) => r.status !== to);
    if (changing.length === 0) return;
    const ids = changing.map((r) => r.id);
    const from: ReviewStatus = to === "open" ? "resolved" : "open";
    applyStatus(ids, to);
    setBusy((s) => new Set([...s, ...ids]));
    inflight.current += 1;
    try {
      await reviewsApi.setStatus(ids, to);
      if (!silent) {
        const message = to === "resolved" ? t("resolved", { count: ids.length }) : t("reopened", { count: ids.length });
        toast.undo(message, () => void flip(changing.map((r) => ({ ...r, status: to })), from, true));
      }
    } catch {
      applyStatus(ids, from);
      toast.error(t("failed"));
    } finally {
      setBusy((s) => {
        const next = new Set(s);
        for (const id of ids) next.delete(id);
        return next;
      });
      settle();
    }
  }

  /* ---- drawer ---- */
  const activeRow = reviewId === null ? null : (rows.find((r) => r.id === reviewId) ?? null);
  const activeIndex = activeRow ? navList.findIndex((r) => r.id === activeRow.id) : -1;
  const step = (delta: number) => {
    const next = navList[activeIndex + delta];
    if (next) setReview(next.id);
  };
  /** Triage flow: flipping from the drawer moves on to the next item when the row leaves this tab. */
  const toggleFromDrawer = (r: ReviewRow) => {
    const next = tab === "all" ? null : (navList[activeIndex + 1] ?? navList[activeIndex - 1] ?? null);
    void flip([r], r.status === "open" ? "resolved" : "open");
    if (next) setReview(next.id);
  };

  const tabItems = TABS.map((value) => ({ value, label: t(`tabs.${value}`), count: counts[value] }));

  const bulk = (selected: ReviewRow[], clear: () => void) => {
    const openOnes = selected.filter((r) => r.status === "open");
    const resolvedOnes = selected.filter((r) => r.status === "resolved");
    return (
      <>
        {openOnes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void flip(openOnes, "resolved");
              clear();
            }}
          >
            <Check size={13} aria-hidden />
            {t("bulkResolve")}
          </Button>
        )}
        {resolvedOnes.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              void flip(resolvedOnes, "open");
              clear();
            }}
          >
            <RotateCcw size={13} aria-hidden />
            {t("bulkReopen")}
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Tabs ariaLabel={t("tabs.label")} items={tabItems} value={tab} onValueChange={setTab} idPrefix="reviews" />
      <div role="tabpanel" id={`reviews-panel-${tab}`} aria-labelledby={`reviews-tab-${tab}`} className="outline-none">
        <DataTable
          caption={t("caption")}
          columns={columns}
          rows={visible}
          rowKey={(r) => String(r.id)}
          state={state}
          onStateChange={patch}
          search={searchDef}
          filters={filters}
          selectable
          bulkActions={bulk}
          onRowClick={(r) => setReview(r.id)}
          empty={{
            icon: <Inbox size={18} strokeWidth={1.75} />,
            title: tab === "resolved" ? t("emptyResolved") : t("empty"),
            description: tab === "resolved" ? t("emptyResolvedBody") : t("emptyBody"),
          }}
        />
      </div>
      <ReviewDrawer
        row={activeRow}
        open={activeRow !== null}
        onOpenChange={(o) => {
          if (!o) setReview(null);
        }}
        index={activeIndex}
        total={navList.length}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
        onToggle={toggleFromDrawer}
        busy={activeRow !== null && busy.has(activeRow.id)}
      />
    </div>
  );
}
