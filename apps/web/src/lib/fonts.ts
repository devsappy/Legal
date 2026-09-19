import { Geist, Geist_Mono, IBM_Plex_Sans_Devanagari, Noto_Sans_Tamil } from "next/font/google";

/** Cobalt Mono: one sans family for everything; weight carries the hierarchy. */
export const body = Geist({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const devanagari = IBM_Plex_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-devanagari",
  display: "swap",
});

export const tamil = Noto_Sans_Tamil({
  subsets: ["tamil", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-tamil",
  display: "swap",
});

/** Section numbers, form codes, timestamps, tool chips. */
export const mono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const fontVariables = [body.variable, devanagari.variable, tamil.variable, mono.variable].join(" ");
