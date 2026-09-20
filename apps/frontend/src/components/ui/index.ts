/**
 * Barrel for the UI primitives. Server-safe modules stay server-safe when
 * imported from here; the client modules carry their own "use client".
 * See README.md in this folder for variants, colour and motion rules.
 */

/* ---- controls ------------------------------------------------------------ */
export { Button, buttonClasses, type ButtonSize, type ButtonVariant } from "./Button";
export { IconButton } from "./IconButton";
export { Input } from "./Input";
export { Textarea } from "./Textarea";
export { Select } from "./Select";
export { Field, type FieldA11y } from "./Field";
export { Checkbox } from "./Checkbox";
export { Switch } from "./Switch";

/* ---- display ------------------------------------------------------------- */
export { Badge, type BadgeKind } from "./Badge";
export { Kbd } from "./Kbd";
export { Avatar, initialsOf } from "./Avatar";
export { BrandMark } from "./BrandMark";
export { Card, CardHeader } from "./Card";
export { Stat } from "./Stat";
export { Skeleton, SkeletonCard, SkeletonRows, SkeletonText } from "./Skeleton";
export { EmptyState } from "./EmptyState";
export { Meter } from "./Meter";
export { Spinner } from "./Spinner";
export { Tabs, type TabItem } from "./Tabs";
export { Disclosure } from "./Disclosure";
export { PageHeader } from "./PageHeader";
export { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/* ---- overlays ------------------------------------------------------------ */
export { Portal } from "./Portal";
export { Tooltip, useMergedRef } from "./Tooltip";
export { DIALOG_SURFACE, Dialog, DialogBase, type DialogBaseProps } from "./Dialog";
export { Drawer } from "./Drawer";
export { AlertDialog, type AlertDialogProps } from "./AlertDialog";
export { Popover } from "./Popover";
export {
  DropdownMenu,
  MenuCheckboxItem,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
} from "./DropdownMenu";
export { Toaster, type ToasterLabels } from "./Toast";

/* ---- data ---------------------------------------------------------------- */
export * from "./DataTable";
