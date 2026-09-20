"use client";

import { useTranslations } from "next-intl";
import type { SessionUser } from "@sahayak/shared";
import { Drawer } from "@/components/ui/Drawer";
import { Sidebar } from "./Sidebar";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SessionUser;
};

/**
 * The sidebar as a left drawer below `lg`. The Drawer primitive gives the
 * focus trap, Escape, the backdrop and focus return to the hamburger; the
 * shell closes it on route change. Below `sm` the primitive presents it as
 * a bottom sheet with a grab handle.
 */
export function MobileDrawer({ open, onOpenChange, user }: Props) {
  const t = useTranslations();
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="left"
      width="min(88vw,300px)"
      title={t("app.name")}
      closeLabel={t("shell.close")}
    >
      <Sidebar user={user} inDrawer onCollapse={() => onOpenChange(false)} onNavigate={() => onOpenChange(false)} />
    </Drawer>
  );
}
