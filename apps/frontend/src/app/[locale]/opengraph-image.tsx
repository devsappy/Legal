import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { JURISDICTIONS, LANGUAGES } from "@sahayak/shared";
import { routing } from "@/i18n/routing";

/* The card's fixed metadata; the picture itself is drawn per locale below. */
export const alt = "Sahakar Sahayak";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* Ink on paper, as on the site. Hex is unavoidable here: this is a rendered
   PNG, not a stylesheet, and the tokens do not reach it. */
const INK = "#09090b";
const PAPER = "#ffffff";
const INK_2 = "#3f3f46";
const INK_3 = "#71717a";
const RULE = "#e4e4e7";

type Font = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600; style: "normal" };

/**
 * Fetches one Google Fonts face as a TTF buffer, trimmed to the characters
 * that will be drawn. The CSS endpoint returns TrueType for a plain fetch
 * (no browser user agent), which is what satori needs.
 */
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).text();
  const match = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/);
  if (!match) throw new Error(`no TrueType source for ${family}`);
  const res = await fetch(match[1], { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`font download failed for ${family}: ${res.status}`);
  return res.arrayBuffer();
}

/** The Scale glyph from the BrandMark, as plain SVG paths. */
function Mark() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 112,
        height: 112,
        borderRadius: 28,
        background: INK,
      }}
    >
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={PAPER} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="m19 8 3 8a5 5 0 0 1-6 0zV7" />
        <path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1" />
        <path d="m5 8 3 8a5 5 0 0 1-6 0zV7" />
        <path d="M7 21h10" />
      </svg>
    </div>
  );
}

/**
 * 1200×630 card for link previews: the brand tile, the app name, the
 * landing title in the page's language and a row of the six Act codes and
 * four language names. Devanagari and Tamil faces are fetched from Google
 * Fonts at build time; if that fails the English title is drawn with the
 * bundled Latin face instead of tofu.
 */
export default async function OpenGraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [t, app] = await Promise.all([
    getTranslations({ locale, namespace: "landing" }),
    getTranslations({ locale, namespace: "app" }),
  ]);
  const english = await getTranslations({ locale: routing.defaultLocale, namespace: "landing" });

  const codes = JURISDICTIONS.map((j) => j.short.split(" ")[0]).join(" · ");
  const languages = LANGUAGES.map((l) => l.native).join(" · ");
  const name = app("name");
  let title = t("seo.ogTitle");
  let subtitle = t("subtitle");

  // Characters each face has to cover; Latin serves the codes and any ASCII.
  const devanagari = LANGUAGES.filter((l) => l.code === "hi" || l.code === "mr")
    .map((l) => l.native)
    .join("");
  const tamil = LANGUAGES.filter((l) => l.code === "ta")
    .map((l) => l.native)
    .join("");
  const latinText = `${codes}${languages}${name}${title}${subtitle}${english("seo.ogTitle")}${english("subtitle")}`;
  const indicText = `${devanagari}${name}${title}${subtitle}`;

  let fonts: Font[] | undefined;
  try {
    const [latin, deva, tam] = await Promise.all([
      loadGoogleFont("Geist", 500, latinText),
      loadGoogleFont("IBM Plex Sans Devanagari", 500, locale === "ta" ? devanagari : indicText),
      loadGoogleFont("Noto Sans Tamil", 500, locale === "ta" ? indicText : tamil),
    ]);
    fonts = [
      { name: "Latin", data: latin, weight: 500, style: "normal" },
      { name: "Devanagari", data: deva, weight: 500, style: "normal" },
      { name: "Tamil", data: tam, weight: 500, style: "normal" },
    ];
  } catch {
    // Offline build: the bundled Latin face cannot shape Devanagari or Tamil.
    fonts = undefined;
    title = english("seo.ogTitle");
    subtitle = english("subtitle");
  }
  const family = fonts ? "Latin, Devanagari, Tamil" : "geist";
  const long = title.length > 48;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: PAPER,
          color: INK,
          fontFamily: family,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Mark />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, fontWeight: 500, letterSpacing: -0.5 }}>{name}</div>
            <div style={{ fontSize: 22, color: INK_3, marginTop: 6 }}>{app("tagline")}</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: long ? 56 : 68,
              fontWeight: 500,
              lineHeight: 1.12,
              letterSpacing: -1.5,
              maxWidth: 1040,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 26, color: INK_2, marginTop: 20, maxWidth: 980, lineHeight: 1.4 }}>{subtitle}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${RULE}`,
            paddingTop: 24,
            fontSize: 22,
            color: INK_2,
            letterSpacing: 1,
          }}
        >
          <div style={{ display: "flex" }}>{codes}</div>
          <div style={{ display: "flex" }}>{languages}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
