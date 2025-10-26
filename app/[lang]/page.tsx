import clsx from "clsx";
import { Suspense } from "react";
import { WildWorld, CondeSans } from "../fonts";
import { getDictionary } from "@/lib/getDictionary";
import ParallaxImage from "@/components/parallaxImg";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="h-full w-full relative flex  p-4 md:p-8 lg:p-12">
        <section className="absolute top-0 flex z-10 place-items-center w-full justify-center inset-0">
          {/* Parallax layer (client-only render) */}
          <ParallaxImage
            src="/poses/jump.webp"
            alt={dictionary.img.background.alt}
          />
        </section>
        <div
          className="min-h-full w-full z-10 grid [grid-template-areas:'left_stage''left_bar']
          [grid-template-columns:25%_1fr] auto-rows-auto min-w-0
          [grid-template-rows:1fr_auto]"
        >
          <div
            className={clsx("[grid-area:left] min-w-0 min-h-0 overflow-hidden")}
          >
            <h1
              className={clsx(
                CondeSans.className,
                "[container-type:inline-size]",
                "text-[clamp(96px,calc(18cqw-0.5rem),333px)]",
                "[word-spacing:.02em]",
                "leading-[0.96] sm:leading-[0.94] md:leading-[0.92] xl:leading-[0.90]",
                "tracking-[0.01em] md:tracking-[-0.005em] xl:tracking-[-0.015em]",
                "font-condensed select-none uppercase antialiased text-hero-bevel",
              )}
            >
              {dictionary.name}
            </h1>
          </div>
          <div className="[grid-area:bar] min-w-0 min-h-0 overflow-hidden">
            <h2
              className={clsx(
                WildWorld.className,
                "[container-type:inline-size]",
                "text-[clamp(36px,calc(10cqw-0.5rem),96px)] [word-spacing:.05em]",
                "[word-spacing:.015em]",
                "leading-[0.96] sm:leading-[0.94] md:leading-[0.92] xl:leading-[1.1]",
                "tracking-[0.01em] md:tracking-[-0.005em] xl:tracking-[-0.015em]",
                "font-condensed select-none uppercase text-hero-glow antialiased text-end",
              )}
            >
              {dictionary.title}
            </h2>
          </div>

          <div className="[grid-area:stage] flex flex-1 flex-col md:flex-row-reverse  w-full  items-end gap-4 md:gap-8 lg:gap-12 p-4 md:p-8 lg:p-12 ">
            {dictionary.buttons.map((button) => (
              <button key={button.label}>
                <a
                  className="glass-button"
                  href={button.href}
                  target={button.target}
                  rel={button.rel}
                >
                  {button.label}
                </a>
              </button>
            ))}
          </div>
        </div>
      </main>
    </Suspense>
  );
}
