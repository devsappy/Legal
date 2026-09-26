import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Checklist, Conversation, ReviewRow } from "@sahayak/shared";
import { backendResult } from "@/lib/backend";
import { getSessionUser } from "@/lib/auth";
import { currentMinute } from "@/lib/greeting";
import { Card } from "@/components/ui/Card";
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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("title") };
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

  // Only what each card needs crosses to the client: no transcripts, no steps.
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
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Greeting name={user.name} serverNow={serverNow} />

      {/* One card per idea, top to bottom in order of what someone came here to do. */}
      <div className="mt-6 flex flex-col gap-4">
        <Card>
          <QuickAsk />
        </Card>

        {/* Both render nothing unless the device says a first run is in progress. */}
        <WelcomeCard name={user.name} />
        <GettingStarted />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <ContinueList items={recent} serverNow={serverNow} />
          </Card>
          <Card>
            <SuggestedQuestions />
          </Card>
          <Card>
            <ProcedureShortcuts procedures={shortcuts} />
          </Card>
          <Card>
            <StatusCard />
          </Card>
        </div>

        {/* The strip draws its own hairline sub-grid, so the card gives it no padding. */}
        <Card padded={false} className="overflow-hidden">
          <StatsStrip stats={corpus} />
        </Card>

        <Card>
          <WhatsNewCard locale={locale} />
        </Card>

        {isAdmin && (
          <Card>
            <AdminTile openReviews={openReviews} indexCurrent={indexCurrent} />
          </Card>
        )}
      </div>
    </div>
  );
}
