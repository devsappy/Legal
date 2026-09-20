"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { BookA, Check, Download, Pencil, Plus, Trash2, X } from "lucide-react";
import type { GlossaryRow } from "@sahayak/shared";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ApiError, glossary as glossaryApi, type GlossaryDraft } from "@/lib/admin-api";
import { downloadCsv } from "@/lib/csv";
import { exportFilename } from "@/lib/export";
import { toast } from "@/lib/toast";
import {
  Badge,
  Button,
  Card,
  DataTable,
  Drawer,
  IconButton,
  Input,
  PageHeader,
  Spinner,
  useTableState,
  type ColumnDef,
  type FilterDef,
} from "@/components/ui";
import { EMPTY_DRAFT, GlossaryForm, TRANSLATIONS } from "./GlossaryForm";

type Props = {
  rows: GlossaryRow[];
  /** Open the add form on first render (the page saw ?add=1). */
  defaultAdding?: boolean;
};

type Editing = { id: number; draft: GlossaryDraft; error: string | null };

function missingCount(r: GlossaryRow): number {
  return TRANSLATIONS.filter((l) => !r[l.code].trim()).length;
}

function byTerm(a: GlossaryRow, b: GlossaryRow) {
  return a.term.localeCompare(b.term, undefined, { sensitivity: "base" });
}

/** Strips ?add=1 once the form closes so a reload does not reopen it. */
function clearAddParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("add")) return;
  url.searchParams.delete("add");
  window.history.replaceState(null, "", url);
}

/**
 * Glossary editor. Rows are local state seeded from the server; create,
 * update and delete apply at once and roll back if the API says no (a 409
 * on create comes back as an inline "already exists" on the term field).
 * On sm+ adding is a panel above the table and editing happens in the row
 * (inputs bound to one hidden <form> through the `form` attribute, so Enter
 * saves and Escape cancels); below sm both open a bottom drawer.
 */
export function GlossaryTable({ rows: serverRows, defaultAdding = false }: Props) {
  const t = useTranslations("admin.terms");
  const phone = useMediaQuery("(max-width: 639px)");
  const uid = useId();
  const editFormId = `${uid}-edit`;

  /* ---- rows ---- */
  const [prevServer, setPrevServer] = useState(serverRows);
  const [rows, setRows] = useState(serverRows);
  if (serverRows !== prevServer) {
    setPrevServer(serverRows);
    setRows(serverRows);
  }
  const [busy, setBusy] = useState<ReadonlySet<number>>(() => new Set());
  const mark = (id: number, on: boolean) =>
    setBusy((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  /* ---- add / edit state ---- */
  const [adding, setAdding] = useState(defaultAdding);
  const [addDraft, setAddDraft] = useState<GlossaryDraft>(EMPTY_DRAFT);
  const [addError, setAddError] = useState<string | null>(null);
  const [addKey, setAddKey] = useState(0);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [state, patch] = useTableState({ syncUrl: true });

  const openAdd = () => {
    setEditing(null);
    setAddDraft(EMPTY_DRAFT);
    setAddError(null);
    setAddKey((k) => k + 1);
    setAdding(true);
  };
  const closeAdd = () => {
    setAdding(false);
    setAddError(null);
    clearAddParam();
  };
  const openEdit = (r: GlossaryRow) => {
    setAdding(false);
    setEditing({
      id: r.id,
      draft: { term: r.term, hi: r.hi, mr: r.mr, ta: r.ta, source: r.source },
      error: null,
    });
  };
  const closeEdit = () => setEditing(null);

  /* ---- mutations ---- */
  const create = async (draft: GlossaryDraft) => {
    const temp: GlossaryRow = { id: -Date.now(), ...draft };
    setRows((list) => [...list, temp].sort(byTerm));
    setAdding(false);
    clearAddParam();
    mark(temp.id, true);
    try {
      const id = await glossaryApi.create(draft);
      setRows((list) => list.map((r) => (r.id === temp.id ? { ...r, id } : r)));
      toast.success(t("added"));
    } catch (err) {
      setRows((list) => list.filter((r) => r.id !== temp.id));
      if (err instanceof ApiError && err.status === 409) {
        setAddDraft(draft);
        setAddError(t("exists"));
        setAddKey((k) => k + 1);
        setAdding(true);
      } else {
        toast.error(t("failed"));
      }
    } finally {
      mark(temp.id, false);
    }
  };

  const update = async (id: number, draft: GlossaryDraft) => {
    const before = rows.find((r) => r.id === id);
    if (!before) return;
    const next: GlossaryRow = { id, ...draft };
    setRows((list) => list.map((r) => (r.id === id ? next : r)).sort(byTerm));
    setEditing(null);
    mark(id, true);
    try {
      await glossaryApi.update(next);
      toast.success(t("saved"));
    } catch (err) {
      setRows((list) => list.map((r) => (r.id === id ? before : r)).sort(byTerm));
      if (err instanceof ApiError && err.status === 409) setEditing({ id, draft, error: t("exists") });
      else toast.error(t("failed"));
    } finally {
      mark(id, false);
    }
  };

  const remove = async (row: GlossaryRow) => {
    setRows((list) => list.filter((r) => r.id !== row.id));
    if (editing?.id === row.id) setEditing(null);
    try {
      await glossaryApi.remove(row.id);
      toast.undo(t("deleted"), () => {
        // Re-create the row; the backend hands out a new id.
        const temp: GlossaryRow = { ...row, id: -Date.now() };
        setRows((list) => [...list, temp].sort(byTerm));
        mark(temp.id, true);
        glossaryApi
          .create({
            term: row.term,
            hi: row.hi,
            mr: row.mr,
            ta: row.ta,
            source: row.source,
          })
          .then((id) => {
            setRows((list) => list.map((r) => (r.id === temp.id ? { ...r, id } : r)));
            toast.success(t("restored"));
          })
          .catch(() => {
            setRows((list) => list.filter((r) => r.id !== temp.id));
            toast.error(t("restoreFailed"));
          })
          .finally(() => mark(temp.id, false));
      });
    } catch {
      setRows((list) => [...list, row].sort(byTerm));
      toast.error(t("deleteFailed"));
    }
  };

  /* ---- inline edit (sm+) ---- */
  const editDraft = editing?.draft;
  const setEditField = (key: keyof GlossaryDraft, value: string) =>
    setEditing((e) => (e ? { ...e, draft: { ...e.draft, [key]: value } } : e));
  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const term = editing.draft.term.trim();
    if (!term) {
      setEditing({ ...editing, error: t("form.required") });
      return;
    }
    void update(editing.id, {
      term,
      hi: editing.draft.hi.trim(),
      mr: editing.draft.mr.trim(),
      ta: editing.draft.ta.trim(),
      source: editing.draft.source.trim(),
    });
  };
  const onEditKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      closeEdit();
    }
  };
  const inlineEditing = (r: GlossaryRow) => !phone && editing?.id === r.id && editDraft !== undefined;

  const cellInput = (
    r: GlossaryRow,
    key: keyof GlossaryDraft,
    label: string,
    extra?: { lang?: string; mono?: boolean; autoFocus?: boolean },
  ) => (
    <Input
      form={editFormId}
      size="sm"
      aria-label={label}
      lang={extra?.lang}
      value={editDraft?.[key] ?? ""}
      onChange={(e) => setEditField(key, e.target.value)}
      onKeyDown={onEditKey}
      autoFocus={extra?.autoFocus}
      autoComplete="off"
      invalid={key === "term" && Boolean(editing?.error)}
      className={extra?.mono ? "font-mono" : undefined}
      disabled={busy.has(r.id)}
    />
  );

  /* ---- table ---- */
  const columns: ColumnDef<GlossaryRow>[] = [
    {
      id: "term",
      header: t("columns.term"),
      width: "24%",
      sortValue: (r) => r.term,
      cell: (r) =>
        inlineEditing(r) ? (
          <div className="flex flex-col gap-1">
            {cellInput(r, "term", t("form.term"), { autoFocus: true })}
            {editing?.error && (
              <p role="alert" className="text-xs text-seal">
                {editing.error}
              </p>
            )}
          </div>
        ) : (
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-ink">{r.term}</span>
            {missingCount(r) > 0 && (
              <Badge kind="warn" dot>
                {t("missingCount", { count: missingCount(r) })}
              </Badge>
            )}
          </span>
        ),
    },
    ...TRANSLATIONS.map<ColumnDef<GlossaryRow>>((l) => ({
      id: l.code,
      header: l.native,
      cell: (r) =>
        inlineEditing(r) ? (
          cellInput(r, l.code, t("form.translation", { language: l.native }), {
            lang: l.code,
          })
        ) : r[l.code].trim() ? (
          <span lang={l.code}>{r[l.code]}</span>
        ) : (
          <span className="text-ink-3" aria-hidden>
            —
          </span>
        ),
    })),
    {
      id: "source",
      header: t("columns.source"),
      mono: true,
      width: "16%",
      sortValue: (r) => r.source,
      cell: (r) =>
        inlineEditing(r)
          ? cellInput(r, "source", t("form.source"), { mono: true })
          : r.source || <span className="text-ink-3">—</span>,
    },
    {
      id: "actions",
      header: t("columns.actions"),
      align: "right",
      width: "96px",
      cell: (r) =>
        inlineEditing(r) ? (
          <span className="inline-flex items-center gap-1">
            <IconButton
              label={t("form.save")}
              size="sm"
              variant="outline"
              type="submit"
              form={editFormId}
              disabled={busy.has(r.id)}
            >
              <Check size={14} />
            </IconButton>
            <IconButton label={t("form.cancel")} size="sm" onClick={closeEdit}>
              <X size={14} />
            </IconButton>
          </span>
        ) : busy.has(r.id) ? (
          <Spinner size={14} label={t("saving")} className="text-ink-3" />
        ) : (
          <span className="inline-flex items-center gap-1">
            <IconButton label={t("edit")} size="sm" onClick={() => openEdit(r)}>
              <Pencil size={14} />
            </IconButton>
            <IconButton label={t("delete")} size="sm" onClick={() => void remove(r)}>
              <Trash2 size={14} />
            </IconButton>
          </span>
        ),
    },
  ];

  const filters: FilterDef<GlossaryRow>[] = [
    {
      id: "translations",
      label: t("filter"),
      options: [
        { value: "missing", label: t("missing") },
        { value: "complete", label: t("complete") },
      ],
      test: (r, v) => v.includes(missingCount(r) > 0 ? "missing" : "complete"),
    },
  ];

  const exportCsv = () =>
    downloadCsv(
      exportFilename("glossary", "csv"),
      [t("columns.term"), ...TRANSLATIONS.map((l) => l.native), t("columns.source")],
      [...rows].sort(byTerm).map((r) => [r.term, r.hi, r.mr, r.ta, r.source]),
    );

  const addButton = (
    <Button variant="primary" size="md" onClick={openAdd} disabled={adding}>
      <Plus size={14} aria-hidden />
      {t("addTerm")}
    </Button>
  );

  const drawerOpen = phone && (adding || editing !== null);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} description={t("description")} count={rows.length} actions={addButton} />

      {/* Hidden form owner for the inline row inputs (they point at it with form=). */}
      <form id={editFormId} onSubmit={submitEdit} className="hidden" aria-hidden />

      {adding && !phone && (
        <Card as="section">
          <h2 className="mb-3 text-sm font-medium text-ink">{t("addTerm")}</h2>
          <GlossaryForm
            key={addKey}
            initial={addDraft}
            onSubmit={(d) => void create(d)}
            onCancel={closeAdd}
            termError={addError}
            layout="grid"
            autoFocus
          />
        </Card>
      )}

      <DataTable
        caption={t("caption")}
        columns={columns}
        rows={rows}
        rowKey={(r) => String(r.id)}
        state={state}
        onStateChange={patch}
        search={{
          placeholder: t("search"),
          test: (r, q) => [r.term, r.hi, r.mr, r.ta, r.source].some((v) => v.toLowerCase().includes(q)),
        }}
        filters={filters}
        toolbarActions={
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={13} aria-hidden />
            {t("exportCsv")}
          </Button>
        }
        empty={{
          icon: <BookA size={18} strokeWidth={1.75} />,
          title: t("empty"),
          description: t("emptyBody"),
          action: (
            <Button variant="primary" size="sm" onClick={openAdd}>
              <Plus size={14} aria-hidden />
              {t("emptyAction")}
            </Button>
          ),
        }}
      />

      <Drawer
        open={drawerOpen}
        onOpenChange={(o) => {
          if (o) return;
          if (adding) closeAdd();
          if (editing) closeEdit();
        }}
        side="bottom"
        title={editing ? t("editTerm") : t("addTerm")}
      >
        {drawerOpen && (
          <GlossaryForm
            key={editing ? `edit-${editing.id}` : `add-${addKey}`}
            initial={editing ? editing.draft : addDraft}
            onSubmit={(d) => (editing ? void update(editing.id, d) : void create(d))}
            onCancel={editing ? closeEdit : closeAdd}
            termError={editing ? editing.error : addError}
            layout="stack"
            autoFocus
            busy={editing ? busy.has(editing.id) : false}
          />
        )}
      </Drawer>
    </div>
  );
}
