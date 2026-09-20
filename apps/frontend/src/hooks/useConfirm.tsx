"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog } from "@/components/ui/AlertDialog";

export type ConfirmOpts = {
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** The user must type this text before confirm enables (e.g. the society's name). */
  typeToConfirm?: string;
  typeToConfirmHint?: string;
};

export type ConfirmFn = (opts: ConfirmOpts) => Promise<boolean>;

/** Fallback button copy when a call leaves the labels out. */
export type ConfirmLabels = { confirm: string; cancel: string };

const ConfirmContext = createContext<ConfirmFn | null>(null);

type Pending = { opts: ConfirmOpts; resolve: (ok: boolean) => void };

/**
 * Mounts one AlertDialog for the whole app and hands out `confirm()` through
 * context. Mounted once in the locale layout. Button copy falls back to the
 * translated `ui.confirm` / `ui.cancel`, so callers can omit
 * confirmLabel/cancelLabel; `labels` overrides those defaults.
 *
 * Only one question can be pending: a second call resolves the first with
 * `false` and replaces it.
 */
export function ConfirmProvider({
  children,
  labels: overrides,
}: {
  children: ReactNode;
  labels?: Partial<ConfirmLabels>;
}) {
  const t = useTranslations("ui");
  const labels: ConfirmLabels = { confirm: overrides?.confirm ?? t("confirm"), cancel: overrides?.cancel ?? t("cancel") };
  const [pending, setPending] = useState<Pending | null>(null);
  // `open` is separate from `pending` so the text stays put during the exit transition.
  const [open, setOpen] = useState(false);
  const live = useRef<Pending | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (opts) =>
      new Promise<boolean>((resolve) => {
        live.current?.resolve(false);
        const next = { opts, resolve };
        live.current = next;
        setPending(next);
        setOpen(true);
      }),
    [],
  );

  const settle = (ok: boolean) => {
    live.current?.resolve(ok);
    live.current = null;
    setOpen(false);
  };

  const opts = pending?.opts;
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <AlertDialog
          open={open}
          onOpenChange={(o) => {
            if (!o) settle(false);
          }}
          title={opts.title}
          body={opts.body}
          confirmLabel={opts.confirmLabel ?? labels.confirm}
          cancelLabel={opts.cancelLabel ?? labels.cancel}
          destructive={opts.destructive}
          typeToConfirm={opts.typeToConfirm}
          typeToConfirmHint={opts.typeToConfirmHint}
          onConfirm={() => settle(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

let warned = false;

/**
 * `const confirm = useConfirm(); if (await confirm({ title, destructive: true })) …`
 * Resolves true on confirm, false on cancel, Escape or a replacing call.
 * Without a provider it degrades to window.confirm so a missing mount
 * never blocks a destructive action from being questioned.
 */
export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  return (
    fn ??
    ((opts) => {
      if (!warned && process.env.NODE_ENV !== "production") {
        warned = true;
        console.warn("useConfirm(): no <ConfirmProvider> above this component; falling back to window.confirm.");
      }
      return Promise.resolve(window.confirm(opts.body ? `${opts.title}\n\n${opts.body}` : opts.title));
    })
  );
}
