# UI primitives

The shared vocabulary every feature package builds on. Import from the barrel
(`@/components/ui`) or from the individual files; the signatures below are
frozen — if something is missing, ask the primitives owner rather than adding
files under `src/components/ui`, `src/hooks` or `src/lib`.

```tsx
import { Button, Card, DataTable, Dialog, EmptyState, PageHeader } from "@/components/ui";
import { toast } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
```

## Colour rules

The brand is monochrome: black ink on white paper, greys for everything else.

| Use | Utilities |
| --- | --- |
| Surfaces | `bg-paper` (page), `bg-sheet` (cards, inputs, dialogs), `bg-shell` (app frame), `bg-muted` / `bg-secondary` (tints), `bg-brand-soft` |
| Text | `text-ink` (primary), `text-ink-2` (secondary), `text-ink-3` (captions, placeholders), `text-paper` on inverted surfaces |
| Lines | `border-rule` (hairline), `border-rule-strong` (emphasised, grid gaps: `gap-px bg-rule-strong`) |
| Inverted | `bg-ink text-paper` / `bg-primary text-primary-foreground` — always the token pair, never `bg-black text-white`, so dark mode flips it |
| Errors, escalation, destructive, "down" | `text-seal`, `border-seal/40`, `bg-seal-soft` — **nowhere else** |
| Verified citations | `text-verified`, `bg-verified-soft` — **nowhere else** |
| Shadows | `shadow-raised`, `shadow-popover`, `shadow-overlay` (dark mode swaps in a hairline ring) |
| Stacking | `z-(--z-sticky)` 10, `z-(--z-drawer)` 40, `z-(--z-dialog)` 50, `z-(--z-popover)` 60, `z-(--z-toast)` 70, `z-(--z-skip)` 80 |

- No hex/rgba literals in TSX. Canvas and SVG colours come from `useToken("--ink", fallback)`.
- No gradients in anything new. No new hues. Tailwind's default palette
  (`bg-blue-500`, `text-zinc-*`, …) is off limits by convention — the build-time
  palette lock was deliberately **not** enabled, so a reviewer, not the compiler,
  catches it. `bg-white` / `bg-black` are allowed only where the landing page
  already used them.
- Light is the default; dark is opt-in through `<html data-theme="dark">`
  (`applyTheme("dark")` in `components/layout/ThemeToggle.tsx`). There is no
  "system" mode and `prefers-color-scheme` is never read. Every inverted
  surface must be checked in both themes.

## Type scale and controls

`text-2xs` 11px · `text-xs` 12.5px · `text-sm` 13.5px · `text-base` 15px ·
`text-lg` 17px · `text-xl` 20px · `text-2xl` 24px · `text-3xl` 30px.
Headings are weight 500 (600 on hi/mr/ta via base CSS). `font-mono` for codes,
timestamps, section numbers and kbd. Control heights `h-7` (xs) / `h-8` (sm) /
`h-9` (md) / `h-10` (lg CTAs). Radii: `rounded-md` controls, `rounded-lg`
cards and inputs, `rounded-full` pills. Icons: lucide 14–16px,
`strokeWidth` 1.75–2, `aria-hidden` when decorative.

Cascade note: the rules in `globals.css` for `:focus-visible`, `h1`–`h3` and
`body` are **unlayered**, so Tailwind utilities cannot override those
properties (`outline-none`, `leading-*` on headings silently lose). Use the
global `.focus-quiet` where an outline must go, or an inline
`style={{ outlineOffset: -2 }}` to inset a ring inside an `overflow` wrapper.

## Motion rules

- Animate only `opacity` and `transform`; 6–8px entrance offsets; exits faster
  than entrances. Durations `--dur-1` 120ms / `--dur-2` 200ms / `--dur-3` 320ms
  (`duration-(--dur-2)`), curves `ease-standard` / `ease-exit`.
- Mark every animated node with `data-motion`. The reduced-motion rule in
  `globals.css` is scoped to `.reveal`, `[data-stagger] > *`, `.rise`,
  `[data-motion]`, `dialog`, `.toast`, `.skeleton` and `.marquee-track`, and it
  applies under both the OS setting and `<html data-motion="reduced">`
  (Settings → reduce motion, `setPref("reduceMotion", true)`). Hover colour
  transitions on buttons and cells survive.
- Component-level branches use `motion-reduce:*` plus
  `[html[data-motion=reduced]_&]:*` so they still without the global rule.
- Global classes: `.rise` (260ms opacity + 6px rise, used by menus, popovers,
  tooltips, BulkBar), `.toast` / `.toast[data-state="closing"]`, `.skeleton`
  (opacity pulse), `.reveal-eager` (server-visible keyframe entrance),
  `.marquee-track` (pauses on hover/focus), `dialog[data-motion]` +
  `data-side="right|left|bottom"` (native `<dialog>` open/close transitions with
  `@starting-style`; browsers without it just show/hide).
- `motion/react` is allowed only inside client islands and only for
  opacity/transform.

## Tiles and cells

- `.cell` — the landing page's grid tile: inverts to ink on hover (keep as is).
  `.cell-link` is the same treatment for tiles that are links and also inverts
  on `:focus-within`. `.cell--tint` gives a muted resting tint. Inside an
  inverted cell, `.cell-badge` flips to paper-on-ink and `.cell-outline`
  lightens its border.
- `.tile` / `.tile--tint` — static tiles for dashboards, settings and pricing:
  `bg-sheet`, tints on hover, never inverts. `.tile` owns the background
  (unlayered), so do not add `bg-*` on the same element; padding comes from
  utilities (`p-5 sm:p-6`).
- `Card` — the `rounded-lg border border-rule bg-sheet` surface for content
  that is not in a hairline grid. `Stat` is borderless so it drops into either.

## Components

Server-safe (no `"use client"`): Button, Input, Textarea, Select, Field, Badge,
Avatar, BrandMark, Card, Stat, Skeleton family, EmptyState, Meter, Spinner,
Disclosure, PageHeader, Breadcrumbs. Client: IconButton, Kbd, Checkbox,
Switch, Tabs, Tooltip, Dialog, Drawer, AlertDialog, Popover, DropdownMenu,
Portal, Toaster, DataTable. Every string a component shows comes in through
props (translate with `useTranslations` / `getTranslations` at the call site);
the few defaults (close buttons, undo, breadcrumb label, table chrome) read the
`ui` namespace themselves.

### Button

```tsx
<Button variant="primary" size="md" loading={busy}>Save</Button>
<Link href="/ask" className={buttonClasses("outline", "sm")}>Open</Link>
```

- `variant`: `outline` (default) · `primary` (ink fill) · `ghost` · `soft`
  (muted fill) · `destructive` (seal outline, never a red fill) · `link`
  (underline on hover, ignores the size ladder).
- `size`: `xs` h-7 · `sm` h-8 · `md` h-9 (default) · `lg` h-10 · `icon` 36px ·
  `icon-sm` 32px.
- `loading`: content stays in the layout (transparent) with a Spinner centred
  over it, so width is kept; sets `aria-busy`, disables, keeps full opacity
  with `cursor-wait`.
- `ref` is forwarded to the `<button>` (React 19 ref-as-prop). `active:translate-y-px`.

### IconButton

`<IconButton label={t("close")} size="sm" variant="ghost"><X size={16} /></IconButton>` —
`label` becomes `aria-label` and (by default) a Tooltip; pass `tooltip={false}`
inside an already-labelled row. Defaults to `type="button"`.

### Input · Textarea · Select · Field

- `Input` props: `icon`, `trailing` (a Kbd hint, a clear button), `invalid`,
  `size` `sm` h-8 / `md` h-9, plus all input attributes. The wrapper
  `<span class="relative inline-flex w-full">` is always rendered and
  `className` lands on it (width utilities apply to the wrapper); `ref` goes to
  the `<input>`.
- `Textarea`: `invalid` + textarea attributes; `ref` to the element.
- `Select` (pre-existing): `options`, `icon`, `size` — the rounded-full pill.
- `Field` wires the label, hint and error once:

```tsx
<Field id="society" label={t("society")} hint={t("societyHint")} error={err} required>
  {(a11y) => <Input {...a11y} value={v} onChange={…} />}
</Field>
```

`children` may also be a plain node. `aria-describedby` order is "error hint";
the error is `role="alert"` in seal. `FieldA11y` is the type of the render-prop argument.

### Badge · Kbd · Avatar

- `Badge kind`: `neutral` (hairline) · `solid` (ink) · `soft` (muted) · `warn`
  (brand-soft, hollow dot) · `bad` (seal — the only red badge) · `verified`
  (green — citations only). `dot`, `mono`. 20px tall, 11px.
- `Kbd combo="mod+k"` renders one chip per key; `mod` is ⌘ on macOS and Ctrl
  elsewhere (hydration-safe: the server renders the Ctrl spelling). Grammar in
  `lib/keys.ts`: `mod+k`, `mod+shift+o`, `shift+/`, `escape`, `g h` (chord).
- `Avatar name size="sm|md|lg" status="ok|degraded|down"` — grapheme-safe
  initials (`initialsOf(name)` is exported) on `bg-brand-soft`; the status dot
  is decorative, so put the status in text nearby.

### Card · CardHeader · Stat · PageHeader · Breadcrumbs

- `Card raised padded as="section"`; `CardHeader title description actions as="h2|h3|div"`.
- `Stat label value sub icon href loading` — 24px tabular value, 11px uppercase
  label; pass `value="—"` when a number is unknown (never fabricate); `loading`
  renders a Skeleton; `href` makes the tile a Link.
- `PageHeader title description eyebrow count actions breadcrumbs tabs` —
  the h1 block; `count` is formatted with Latin digits in every locale.
- `Breadcrumbs items={[{label, href}, …]}` — last item `aria-current="page"`,
  middle crumbs collapse to "…" below sm; the nav's name defaults to `ui.breadcrumb`
  (`ariaLabel` / `breadcrumbsLabel` override it).

### Skeleton · EmptyState · Meter · Spinner

- `Skeleton className`, `SkeletonText lines`, `SkeletonRows rows cols`,
  `SkeletonCard` — all `aria-hidden`; put `aria-busy` on the region.
- `EmptyState icon title description action secondary compact tone="neutral|error"` —
  the required pattern for a failed fetch:

```tsx
<EmptyState tone="error" title={t("errors.loadFailed")} action={<Button onClick={retry}>{t("ui.retry")}</Button>} />
```

- `Meter value={0.72} threshold={0.5} label showValue` — `role="meter"`,
  `aria-valuenow` is the rounded percentage; the fill is `bg-ink`, or
  `bg-seal` below the threshold; animates with `transform: scaleX()` only.
- `Spinner size label` — currentColor ring; a static three-dot glyph under
  reduced motion; `role="status"` only when `label` is given.

### Checkbox · Switch · Tabs · Disclosure

- `Checkbox label indeterminate …inputAttributes` — native input with a drawn
  16px box. With `label` the wrapper `<label>` gets `className`; without it
  pass `aria-label` (or `aria-labelledby`).
- `Switch checked onCheckedChange label description disabled` — `role="switch"`
  on a real button; the track is ink when on, thumb paper.
- `Tabs ariaLabel items value onValueChange idPrefix` — panel mode (no hrefs) is
  a WAI-ARIA tablist with roving tabindex, arrow/Home/End keys and automatic
  activation; render panels as
  `<div role="tabpanel" id={`${idPrefix}-panel-${value}`} aria-labelledby={`${idPrefix}-tab-${value}`}>`.
  Route mode (items with `href`) renders a `<nav>` of links with
  `aria-current="page"` (links that navigate are not announced as tabs); the
  active item is derived from the pathname when `value` is omitted.
- `Disclosure title defaultOpen name id` — native `<details>`; siblings sharing
  `name` form an exclusive accordion (modern browsers only). For print, render it
  open or mark it `data-print="expand"`.

### Tooltip · Popover · DropdownMenu

All three render the trigger as `<child.type {...child.props} ref=… />`: the child
must be a single element that accepts `ref` and pointer/focus handlers (a
`button`, `Button`, `IconButton`, `Link`).

- `Tooltip content side` — shows instantly on keyboard focus, after 400ms on
  hover, never on touch; Escape hides; `role="tooltip"` bubble in ink.
- `Popover trigger open onOpenChange side="top|bottom" align="start|center|end" ariaLabel` —
  non-modal `role="dialog"` panel; focus moves in on open and returns to the
  trigger on Escape/close; outside press closes.
- `DropdownMenu trigger label align side` with `MenuItem icon shortcut destructive disabled href onSelect`,
  `MenuCheckboxItem checked onCheckedChange disabled` (stays open),
  `MenuRadioGroup value onValueChange` + `MenuRadioItem value icon`,
  `MenuSeparator`, `MenuLabel`. Roving focus, ArrowUp/Down/Home/End, typeahead,
  Escape/Tab/outside close, focus return; `shortcut` shows a Kbd hint (bind the
  key with `useHotkey`). `destructive` items are the only seal text in a menu.

Escape ordering: DropdownMenu, Popover and Tooltip call `preventDefault`;
BulkBar and Toaster skip already-handled events, so one Escape closes only the
innermost surface. Native `<dialog>` Escape reports through `onOpenChange(false)`.

### Dialog · Drawer · AlertDialog · useConfirm

- `Dialog open onOpenChange title description size="sm|md|lg" footer initialFocusRef hideTitle closeLabel className` —
  native `<dialog>.showModal()` (top layer, focus trap, `inert` page); backdrop
  click and Escape close; focus returns to the opener; a bottom sheet that grows
  with its content below sm. Initial focus: `initialFocusRef` → first
  `[data-autofocus]` → first focusable → the panel. `closeLabel` defaults to `ui.close`.
- `Drawer open onOpenChange side="right|left|bottom" title description width footer hideTitle closeLabel` —
  same base; slides from its edge on sm+, always a bottom sheet with a
  swipe-to-close handle on phones. Page scroll is locked while open (nesting-safe).
- `DialogBase` and `DIALOG_SURFACE` are exported for bespoke modal surfaces
  (command palette); motion comes from `globals.css`, never from inline transforms.
- `AlertDialog` is what `useConfirm()` renders; feature code normally does not
  render it directly.

```tsx
const confirm = useConfirm();
async function remove() {
  if (!(await confirm({ title: t("deleteTitle"), body: t("deleteBody"), destructive: true }))) return;
  …
}
```

`ConfirmProvider` is mounted once in `[locale]/layout.tsx`; button copy defaults to
`ui.confirm` / `ui.cancel`, and `confirmLabel` / `cancelLabel` / `typeToConfirm`
override per call. Focus lands on the safe (cancel) button; the backdrop does not dismiss.

### Toast

`lib/toast.ts` is a plain store (no React):

```ts
toast.success(t("saved"));
toast.error(t("failed"), { description: reason });
toast.promise(save(), { loading: t("saving"), success: t("saved"), error: t("failed") });
toast.undo(t("deleted"), restore, { onDismiss: () => deleteOnServer(id) });
toast.dismiss(id); // or toast.dismiss() for all
```

- `info`/`success`/`undo` are ink chips, `error` is `bg-sheet border-seal/40`
  with a seal icon and `role="alert"`, `loading` is sticky. 5s, or 8s with an
  action; three at most (older ones are evicted and their `onDismiss` still runs).
- `toast.undo(msg, onUndo, opts)`: the Toaster labels the button with `ui.undo`;
  `opts.onDismiss` runs when the toast leaves for any reason other than Undo
  being clicked (timeout, close button, eviction, `toast.dismiss`). This is the
  hook for the deferred server delete — and the caller must still flush it on
  `pagehide`. A destructive action uses either an undo toast or
  `useConfirm({ destructive: true })`, never both, never neither.
- `<Toaster />` is mounted once in the root layout (fixed bottom-right, full
  width above the safe area on phones); timers pause on hover, focus and hidden
  tabs; Escape dismisses the focused or newest toast. `useToasts()` exposes the
  stack to React if a page needs it.

### DataTable

```tsx
const [state, patch] = useTableState({ syncUrl: true }); // optional: URL-synced
<DataTable
  caption={t("documentsTable")}
  columns={[
    { id: "title", header: t("title"), cell: (r) => r.title, sortValue: (r) => r.title },
    { id: "size", header: t("size"), cell: (r) => formatBytes(r.size, locale), align: "right", mono: true, hideBelow: "md" },
  ]}
  rows={rows}
  rowKey={(r) => r.id}
  search={{ placeholder: t("searchDocuments"), test: (r, q) => r.title.toLowerCase().includes(q) }}
  filters={[{ id: "status", label: t("status"), options, test: (r, v) => v.includes(r.status) }]}
  selectable
  bulkActions={(selected, clear) => <Button variant="ghost" size="sm" onClick={() => act(selected, clear)}>{t("reindex")}</Button>}
  onRowClick={(r) => open(r)}
  state={state}
  onStateChange={patch}
  loading={loading}
  empty={{ title: t("noDocuments"), description: t("noDocumentsHint"), action: <Button>{t("upload")}</Button> }}
/>
```

- Labels: the table reads its chrome (search, clear, clear filters, no results,
  select all, "{n} selected", "1–25 of 132", rows per page, previous, next,
  loading, "{n} results", "Remove filter: {label}") from the `ui` namespace by
  itself. Pass `labels={{ … }}` (a `Partial<DataTableLabels>`) to override any
  of them, or build a full set with `tableLabels(useTranslations("ui"), extra)`.
- `ColumnDef`: `sortValue` makes a column sortable (header cycles asc → desc →
  none with `aria-sort`); `align`, `mono`, `width`, `hideBelow: "sm"|"md"`,
  `mobileLabel` (term shown in the phone card).
- Toolbar: `/` focuses the search (registered in scope `table`); filter menus
  are checkbox groups rendered as removable chips; `toolbarActions` sit at the right end.
- Selection: tri-state header (acts on the current page), shift-click ranges in
  sorted order, BulkBar fixed bottom-centre (`bg-ink text-paper`) with the
  caller's `bulkActions`; Escape clears. Inside the bar use `<Button variant="ghost" size="sm">`.
- Rows: roving tabindex, ArrowUp/Down/Home/End, Enter opens (`onRowClick`),
  Space selects (`selectable`); controls inside a row keep their own clicks.
- Below sm rows render as cards (`mobileLayout="cards"`, default) — both DOM
  trees exist, switched by CSS so SSR never flashes; `"scroll"` keeps the table.
- `loading` → SkeletonRows; `rows.length === 0` → the `empty` EmptyState;
  search/filters hiding everything → "Nothing matches" with a Clear filters button.
- `useTableState({ syncUrl, defaultSize })` returns `[state, patch]`. With
  `syncUrl` the URL is the store: `?q=&sort=<col>&dir=desc&page=N&f.<filter>=a,b`
  (defaults omitted, unrelated params kept); typing replaces history, everything
  else pushes, so Back restores sort/page/filters. Page size persists under
  `coop.table.size`. It reads `window.location` through `useSyncExternalStore`,
  so no Suspense boundary is needed. `defaultTableState`, `parseTableState`,
  `writeTableState` and `DEFAULT_PAGE_SIZE` are exported for tests and links.
- `stickyHeader` bounds the table in a `max-h-[60vh]` scroller (table-local,
  never window-relative).

## Hooks and stores (`src/hooks`, `src/lib`)

| Module | Exports |
| --- | --- |
| `hooks/usePersisted` | `usePersisted(key, initial)` (localStorage as an external store; keys `coop.*`; server snapshot = initial), `readPersisted`, `writePersisted`, `subscribePersisted` |
| `hooks/useHydrated`, `useMediaQuery`, `useIsMac` | booleans that are `false` on the server |
| `hooks/useHotkey` + `lib/shortcuts` | `useHotkey(combo, handler, { id, scope, label, enabled, allowInInputs })` — one window listener, newest binding wins, two-step chords; `registerShortcut`, `useShortcutList`, `groupShortcuts`, `SCOPE_ORDER` |
| `lib/keys` | `Combo`, `isMac`, `formatShortcut`, `matchesCombo`, `parseCombo`, `isEditableTarget` |
| `hooks/useAnchor` | `useAnchor(ref, anchorRef, { side, align, gutter, open })` — writes `position: fixed` coordinates in a layout effect, flips when clipped, sets `data-side` |
| `hooks/useConfirm` | `ConfirmProvider`, `useConfirm`, types `ConfirmOpts`, `ConfirmFn`, `ConfirmLabels` |
| `lib/toast` | `toast`, `useToasts`, `getSnapshot`, `subscribe`, types `ToastItem`, `ToastOpts`, `ToastKind` |
| `lib/health` | `useHealth()` (the only `/api/health` poller: 60s while visible, focus/online re-checks), `refreshHealth`, `getHealth`, `levelFrom`, types `HealthLevel`, `HealthSnapshot` |
| `lib/routes` | `APP_ROUTES`, `routesFor(role)`, `routeFor(pathname)`, `PUBLIC_PATHS`, `PRIVATE_PREFIXES`, `isPrivatePath`, `askHref({ q, jurisdiction })`, `loginHref(next)` |
| `lib/onboarding` | `useOnboarding`, `setOnboarded`, `setPlan`, `isOnboarded` |
| `lib/prefs` | `Prefs`, `DEFAULT_PREFS`, `usePrefs`, `getPrefs`, `setPref`, `applyMotionPreference` |
| `lib/progress` | `useProgress(slug)`, `useAllProgress`, `getProgress`, `toggleStep`, `resetProgress`, `clearProgress` |
| `lib/format` | `relativeTime`, `formatDate`, `formatDateTime`, `formatTime`, `formatNumber`, `formatPercent`, `formatSeconds`, `formatBytes` — Latin digits in every locale |
| `lib/export` | `conversationToMarkdown(conv, labels)`, `exportFilename`, `downloadText` |
| `lib/backend` | `backend`, `backendPublic` (unchanged), `backendResult<T>(path)`, `backendPublicResult<T>(path, revalidate)` → `{ ok, status, data } | { ok: false, status: number | "network", body }` |
| `content/changelog` | `CHANGELOG`, `LATEST_CHANGELOG_ID`, `ChangelogEntry` (copy per locale via `pick`) |
| `components/layout/ThemeToggle` | `ThemeMode = "light" | "dark"`, `applyTheme`, `useTheme`, `ThemeToggle`, `THEME_KEY`, `THEME_EVENT` |
| `hooks/useToken` | `useToken("--ink", fallback)` — computed token value for canvas/SVG, re-read on `coop:theme` |

## Server pages

`await params`, `setRequestLocale(locale)`, `getTranslations`; fetch with
`backendResult<T>()` and branch on `ok` / `status`. A failed fetch renders
`<EmptyState tone="error" … action={<Retry/>} />` (or `<Stat value="—" />`),
never an empty table or a blank page. Server components never await
`/api/health`; health renders client-side from `useHealth()`.

## Print

`data-print="hide"` hides an element; `data-print="expand"` forces it open
(display, max-height, overflow, opacity). Body prints 12pt black on white.
