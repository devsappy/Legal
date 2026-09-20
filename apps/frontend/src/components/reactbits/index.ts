/**
 * Typed entry points for the React Bits components (JS + CSS variant).
 * Sources live next to this file; see the props tables in the original docs.
 */
import type { CSSProperties, ComponentType, ReactNode } from "react";
import CallChipRaw from "./CallChip.jsx";
import VoicePillRaw from "./VoicePill.jsx";
import ThoughtLineRaw from "./ThoughtLine.jsx";
import LatticeLoaderRaw from "./LatticeLoader.jsx";

export type CallChipStatus = "idle" | "running" | "done" | "error";
export type CallChipProps = {
  icon?: "terminal" | "file" | "search" | "edit" | ReactNode;
  name?: string;
  argument?: string;
  status?: CallChipStatus;
  expectedMs?: number;
  size?: number;
  radius?: number;
  color?: string;
  surfaceColor?: string;
  progressColor?: string;
  progressOpacity?: number;
  doneColor?: string;
  errorColor?: string;
  washOpacity?: number;
  shake?: number;
  showTimer?: boolean;
  onRetry?: () => void;
  className?: string;
  style?: CSSProperties;
};

export type VoicePillStopReason =
  | "release" | "tap" | "key" | "escape" | "blur" | "cancel"
  | "disabled" | "mic-denied" | "unmount" | "external";
export type VoicePillProps = {
  accentColor?: string;
  iconColor?: string;
  background?: string;
  size?: number;
  shape?: "pill" | "rounded";
  reach?: number;
  showTime?: boolean;
  waveform?: boolean;
  slideToCancel?: boolean;
  cancelDistance?: number;
  attack?: number;
  release?: number;
  sensitivity?: number;
  floor?: number;
  openDuration?: number;
  pressScale?: number;
  mode?: "auto" | "hold" | "toggle";
  holdAfter?: number;
  reactive?: "simulated" | "mic";
  disabled?: boolean;
  ariaLabel?: string;
  onStart?: (e: { source: "simulated" | "mic" }) => void;
  onStop?: (e: { reason: VoicePillStopReason; duration: number }) => void;
  /** Local addition: change this value to end listening from outside. */
  stopKey?: number;
  className?: string;
};

export type ThoughtLineProps = {
  label?: string;
  doneLabel?: string;
  renderLabel?: (text: string, working: boolean) => ReactNode;
  glyph?: "sparkle" | "dot" | "none" | ReactNode;
  steps?: string[];
  collapsible?: boolean;
  collapseOnSettle?: boolean;
  color?: string;
  glyphColor?: string;
  fontSize?: number;
  breathPeriod?: number;
  breathDepth?: number;
  shimmer?: boolean;
  shimmerDuration?: number;
  settleDuration?: number;
  settleBlur?: number;
  working?: boolean;
  settleAfter?: number;
  elapsed?: number;
  showTimer?: boolean;
  onSettle?: (seconds: number) => void;
  className?: string;
  style?: CSSProperties;
};

export type LatticeLoaderProps = {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: "working" | "done" | "error";
  pattern?: string | { cells: (number | null)[]; loop?: number; scale?: number; lit?: number };
  grid?: 3 | 4;
  shape?: "square" | "round";
  color?: string;
  doneColor?: string;
  errorColor?: string;
  cellSize?: number;
  gap?: number;
  fontSize?: number;
  step?: number;
  idleOpacity?: number;
  glow?: boolean;
  glowColor?: string;
  showTimer?: boolean;
  elapsed?: number;
  className?: string;
  style?: CSSProperties;
};

export const CallChip = CallChipRaw as unknown as ComponentType<CallChipProps>;
export const VoicePill = VoicePillRaw as unknown as ComponentType<VoicePillProps>;
export const ThoughtLine = ThoughtLineRaw as unknown as ComponentType<ThoughtLineProps>;
export const LatticeLoader = LatticeLoaderRaw as unknown as ComponentType<LatticeLoaderProps>;
