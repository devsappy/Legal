import type { ReactNode } from "react";
import clsx from "clsx";
import { Card, CardHeader } from "@/components/ui/Card";

type Props = {
  title: string;
  description?: string;
  /** Right-aligned controls in the header row. */
  actions?: ReactNode;
  /** Seal outline for the danger zone — the only red on the page. */
  danger?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * One settings card: an h2 with a one-line description, then the form or
 * rows. Server-safe, so client forms can wrap themselves in it.
 */
export function SettingsSection({ title, description, actions, danger, className, children }: Props) {
  return (
    <Card as="section" className={clsx(danger && "border-seal/40", className)}>
      <CardHeader as="h2" title={title} description={description} actions={actions} />
      {children}
    </Card>
  );
}
