import clsx from "clsx";
import type { ReactNode } from "react";

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  mono?: boolean;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
}) {
  return (
    <div className="rounded-lg border border-rule bg-sheet overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-ink-3 border-b border-rule">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={clsx("px-3 py-2.5 font-medium whitespace-nowrap", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-ink-3">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={rowKey(r)} className="border-b border-rule last:border-b-0 hover:bg-muted/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={clsx("px-3 py-2.5 align-top", c.mono && "font-mono text-[12.5px]", c.className)}
                  >
                    {c.render(r)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function StatusPill({ kind, label }: { kind: "ok" | "warn" | "bad" | "muted"; label: string }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium",
        kind === "ok" && "bg-verified-soft text-verified",
        kind === "warn" && "bg-violet-soft text-ink",
        kind === "bad" && "bg-seal-soft text-seal",
        kind === "muted" && "bg-muted text-ink-3",
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "w-1.5 h-1.5 rounded-full",
          kind === "ok" && "bg-verified",
          kind === "warn" && "bg-violet",
          kind === "bad" && "bg-seal",
          kind === "muted" && "bg-ink-3",
        )}
      />
      {label}
    </span>
  );
}
