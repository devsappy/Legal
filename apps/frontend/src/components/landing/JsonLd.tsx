import { getTranslations } from "next-intl/server";
import { LANGUAGES } from "@sahayak/shared";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

/**
 * Structured data for the landing page: the FAQ as a FAQPage and the
 * product as a free (pilot) SoftwareApplication. Serialised with "<"
 * escaped so the JSON can never close the script tag.
 */
export async function JsonLd({ locale }: { locale: string }) {
  const t = await getTranslations("landing");
  const app = await getTranslations("app");
  const faq = t.raw("faq.items") as { q: string; a: string }[];
  const url = `${SITE_URL}/${locale}`;

  const data = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: app("name"),
      description: t("subtitle"),
      url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: LANGUAGES.map((l) => l.code),
      availableLanguage: LANGUAGES.map((l) => l.label),
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "INR",
        description: t("hero.note"),
      },
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
