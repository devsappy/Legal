import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SquareCheck } from "lucide-react";
import { BrandMark } from "@/components/ui";
import { Skyline } from "@/components/landing/Skyline";
import { QuestionRotator } from "./QuestionRotator";

type Props = {
  title: string;
  subtitle: string;
  /** The form. */
  children: ReactNode;
  /** Links under the form: switch to register/login, back to home. */
  footer?: ReactNode;
};

/**
 * Shared frame for /login and /register inside the public layout (the
 * header and footer come from there). Left: brand, heading, the form and
 * its links, at most 400px wide. From lg up, the right two thirds are an
 * ink panel that repeats the product promise: the landing headline, three
 * bullets, a rotating sample question and the Skyline cropped along the
 * bottom. Below lg only the left column renders, so phones never scroll
 * sideways.
 */
export async function AuthShell({ title, subtitle, children, footer }: Props) {
  const t = await getTranslations();
  const bullets = t.raw("auth.panel.bullets") as string[];
  const questions = (t.raw("landing.topics.items") as { name: string; example: string }[]).map((x) => x.example);

  return (
    <div className="flex-1 w-full lg:grid lg:min-h-[calc(100dvh-64px)] lg:grid-cols-[minmax(0,480px)_1fr]">
      <section className="flex flex-col justify-center px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto w-full max-w-[400px]">
          <BrandMark size={36} />
          <h1 className="mt-6 text-2xl font-medium text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-2">{subtitle}</p>
          <div className="mt-7">{children}</div>
          {footer && <div className="mt-6 flex flex-col gap-2 border-t border-rule pt-5 text-sm text-ink-2">{footer}</div>}
        </div>
      </section>

      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:flex lg:flex-col">
        <div className="relative z-10 flex flex-1 flex-col justify-center px-12 py-16 xl:px-20">
          <div className="max-w-[560px]">
            <p className="font-mono text-2xs uppercase tracking-[0.12em] text-paper/60">{t("auth.panel.headline")}</p>
            <h2 className="mt-3 text-3xl text-balance text-paper">{t("landing.title")}</h2>
            <ul className="mt-8 flex flex-col gap-3">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-3 text-base text-paper/80">
                  <SquareCheck size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-paper" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 border-t border-paper/15 pt-6">
              <p className="font-mono text-2xs uppercase tracking-[0.12em] text-paper/60">{t("auth.panel.askLabel")}</p>
              <QuestionRotator questions={questions} className="mt-3 text-paper/90" />
            </div>
          </div>
        </div>
        <Skyline className="skyline pointer-events-none absolute -bottom-10 left-1/2 h-auto w-[max(100%,1100px)] max-w-none -translate-x-1/2 text-paper/30" />
      </aside>
    </div>
  );
}
