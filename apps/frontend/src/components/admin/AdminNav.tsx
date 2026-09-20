"use client";

import { useTransition, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useLinkStatus } from "next/link";
import { BookA, FileText, Inbox, LayoutDashboard, RefreshCw, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Button, Spinner, Tabs, type TabItem } from "@/components/ui";

/**
 * The admin section tabs: Overview (exact match on /admin), Documents,
 * Glossary and the Review queue with its open count. Route mode of Tabs
 * renders real links with aria-current; the active value is computed here
 * because /admin is a prefix of every other tab.
 */
const ITEMS: { value: string; href: string; icon: LucideIcon }[] = [
  { value: "overview", href: "/admin", icon: LayoutDashboard },
  { value: "documents", href: "/admin/documents", icon: FileText },
  { value: "glossary", href: "/admin/glossary", icon: BookA },
  { value: "queries", href: "/admin/queries", icon: Inbox },
];

/**
 * Rendered inside the tab's <Link>, so useLinkStatus sees that link's
 * transition: while a force-dynamic page is loading the icon becomes a
 * spinner and a faint bar appears under the item (the ink underline moves
 * only once the route has changed).
 */
function TabIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { pending } = useLinkStatus();
  if (!pending) return <Icon size={14} strokeWidth={1.75} />;
  return (
    <>
      <Spinner size={14} />
      <span
        aria-hidden
        data-motion
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 animate-pulse bg-ink/30 motion-reduce:animate-none [html[data-motion=reduced]_&]:animate-none"
      />
    </>
  );
}

export function AdminNav({ openCount }: { openCount?: number }) {
  const t = useTranslations("admin");
  const pathname = usePathname();

  const active =
    pathname === "/admin"
      ? "overview"
      : (ITEMS.find((it) => it.value !== "overview" && (pathname === it.href || pathname.startsWith(`${it.href}/`)))?.value ??
        "overview");

  const items: TabItem[] = ITEMS.map((it) => ({
    value: it.value,
    href: it.href,
    label: t(`tabs.${it.value}`),
    icon: <TabIcon icon={it.icon} />,
    count: it.value === "queries" && openCount !== undefined && openCount > 0 ? openCount : undefined,
  }));

  return <Tabs ariaLabel={t("tabs.label")} items={items} value={active} className="-mx-4 px-4 sm:mx-0 sm:px-0" />;
}

/**
 * "Try again" for a page whose server fetch failed: re-runs the server
 * components in place (router.refresh) and shows a spinner meanwhile.
 */
export function RetryButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "outline" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant={variant} size="sm" loading={pending} onClick={() => start(() => router.refresh())}>
      <RefreshCw size={14} aria-hidden />
      {children}
    </Button>
  );
}
