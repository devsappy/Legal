import type { CSSProperties, ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import clsx from "clsx";
import type { Checklist, Conversation, ReviewRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { getSessionUser } from "@/lib/auth";
import { currentMinute } from "@/lib/greeting";
import { Greeting } from "@/components/home/Greeting";
import { QuickAsk } from "@/components/home/QuickAsk";
import { ContinueList, type RecentConversation } from "@/components/home/ContinueList";
import { SuggestedQuestions } from "@/components/home/SuggestedQuestions";
import { ProcedureShortcuts, type ProcedureSummary } from "@/components/home/ProcedureShortcuts";
import { StatsStrip, type CorpusStats } from "@/components/home/StatsStrip";
import { StatusCard } from "@/components/home/StatusCard";
import { WhatsNewCard } from "@/components/home/WhatsNewCard";
import { AdminTile } from "@/components/home/AdminTile";
import { WelcomeCard } from "@/components/home/WelcomeCard";
import { GettingStarted } from "@/components/home/GettingStarted";

/* Personal, per-request data: never cache. */
export const dynamic = "force-dynamic";

/* The landing page's hairline grid: 1px gaps in the rule colour, opaque tiles. */
const BOX = "grid grid-cols-12 gap-px overflow-hidden rounded-md border border-rule-strong bg-rule-strong";
const TILE = "tile min-w-0 p-5 sm:p-6";
/* Tiles rise in one after another; reduced motion (OS or Settings) stills them via data-motion. */
const ENTER = "animate-[reveal-eager_var(--dur-3)_var(--ease-standard)_both] motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none";
const STEP_MS = 45;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("title") };
}

/** One grid cell with the entrance stagger; `index` sets its place in the sequence. */
function Tile({ span, index, children }: { span: string; index: number; children: ReactNode }) {
  return (
    <div className={clsx(TILE, span, ENTER)} data-motion style={{ animationDelay: `${index * STEP_MS}ms` } as CSSProperties}>
      {children}
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The (app) layout owns the sign-in gate and the "service unavailable"
  // screen; when it has nothing for us there is nothing to draw.
  const user = await getSessionUser();
  if (!user) return null;
  const isAdmin = user.role === "admin";

  // Health is deliberately not fetched here: a down model server makes it
  // take seconds, and the StatusCard reads it client-side from lib/health.
  const [conversations, procedures, stats, reviews, documents] = await Promise.all([
    backendResult<{ conversations: Conversation[] }>("/api/conversations"),
    backendResult<{ procedures: Checklist[] }>("/api/procedures"),
    backendResult<{ sections: number; procedures: number; acts: number }>("/api/stats"),
    isAdmin ? backendResult<{ rows: ReviewRow[] }>("/api/admin/reviews") : Promise.resolve(null),
    isAdmin ? backendResult<{ indexed: boolean }>("/api/admin/documents") : Promise.resolve(null),
  ]);

  // Only what each tile needs crosses to the client: no transcripts, no steps.
  const recent: RecentConversation[] | null = conversations.ok
    ? conversations.data.conversations
        .slice(0, 5)
        .map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, count: c.messages.length }))
    : null;
  const shortcuts: ProcedureSummary[] | null = procedures.ok
    ? procedures.data.procedures.map((p) => ({ slug: p.slug, title: p.title, jurisdiction: p.jurisdiction, steps: p.steps.length }))
    : null;
  const corpus: CorpusStats = stats.ok
    ? { sections: stats.data.sections, procedures: stats.data.procedures, acts: stats.data.acts }
    : null;
  const openReviews = reviews?.ok ? reviews.data.rows.filter((r) => r.status === "open").length : null;
  const indexCurrent = documents?.ok ? Boolean(documents.data.indexed) : null;
  // Minute precision, matching what the client store reports, so hydration rarely re-renders.
  const serverNow = currentMinute();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className={BOX}>
        <Tile span="col-span-12 lg:col-span-8" index={0}>
          <Greeting name={user.name} serverNow={serverNow} />
        </Tile>
        <Tile span="col-span-12 lg:col-span-4" index={1}>
          <StatusCard />
        </Tile>

        {/* Renders nothing until the device says a first run is in progress. */}
        <WelcomeCard name={user.name} className={clsx("col-span-12", ENTER)} />

        <Tile span="col-span-12" index={2}>
          <QuickAsk />
        </Tile>

        <GettingStarted className={clsx("col-span-12", ENTER)} />

        <Tile span="col-span-12 md:col-span-6 lg:col-span-5" index={3}>
          <ContinueList items={recent} serverNow={serverNow} />
        </Tile>
        <Tile span="col-span-12 md:col-span-6 lg:col-span-4" index={4}>
          <SuggestedQuestions />
        </Tile>
        <Tile span="col-span-12 lg:col-span-3" index={5}>
          <ProcedureShortcuts procedures={shortcuts} />
        </Tile>

        {/* The stats strip draws its own hairline sub-grid, so no tile padding here. */}
        <div
          className={clsx("col-span-12 min-w-0 lg:col-span-8", ENTER)}
          data-motion
          style={{ animationDelay: `${6 * STEP_MS}ms` } as CSSProperties}
        >
          <StatsStrip stats={corpus} />
        </div>
        <Tile span="col-span-12 lg:col-span-4" index={7}>
          <WhatsNewCard locale={locale} />
        </Tile>

        {isAdmin && (
          <Tile span="col-span-12" index={8}>
            <AdminTile openReviews={openReviews} indexCurrent={indexCurrent} />
          </Tile>
        )}
      </div>
    </div>
  );
}
