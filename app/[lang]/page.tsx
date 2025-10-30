import { getDictionary } from "@/lib/getDictionary";
import ParallaxImage from "@/components/parallaxImg";
import { WildWorld, CondeSans } from "../fonts";
import {
  Wrapper,
  Grid,
  WhoCell,
  WhatCell,
  Who,
  What,
  CtaCell,
  CtaGroup,
  CtaButton,
} from "@/components/ui";

export default async function Page({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dictionary = await getDictionary(lang);

  return (
    <Wrapper>
      <section className="absolute inset-0 top-0 z-10 flex w-full place-items-center justify-center">
        <ParallaxImage
          src="/poses/jump.webp"
          alt={dictionary.img.background.alt}
        />
      </section>

      <Grid>
        <WhoCell>
          <Who className={CondeSans.className}>{dictionary.name}</Who>
        </WhoCell>

        <WhatCell>
          <What className={WildWorld.className}>{dictionary.title}</What>
          {dictionary.titleCta && (
            <div className="ml-4 mt-4 flex flex-col items-end font-medium">
              <span className="block h-0.5 w-1/2 bg-[var(--foreground)]" />
              <button>
                <a
                  href={dictionary.titleCta.href}
                  target={dictionary.titleCta.target}
                  rel={dictionary.titleCta.rel}
                >
                  {dictionary.titleCta.label}
                </a>
              </button>
              <span className="block h-0.5 w-full bg-[var(--foreground)]" />
            </div>
          )}
        </WhatCell>

        <CtaCell>
          <CtaGroup>
            {dictionary.buttons.map((button) => (
              <CtaButton
                className="glass"
                key={button.label}
                href={button.href}
                target={button.target}
                rel={button.rel}
              >
                {button.label}
              </CtaButton>
            ))}
          </CtaGroup>
        </CtaCell>
      </Grid>
    </Wrapper>
  );
}
