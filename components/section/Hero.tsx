import ParallaxImage from "../parallaxImg";
import { WildWorld, CondeSans } from "../ui/fonts";
import {
  Grid,
  WhoCell,
  WhatCell,
  Who,
  What,
  CtaCell,
  CtaGroup,
  CtaButton,
} from "../ui";
type HeroProps = {
  title: string;
  headline: string;
  headlineCta?: AppLinkConfig;
  plxImg: {
    src: string;
    alt: string;
  };
  ctas: AppLinkConfig[];
};

export default function Hero({
  title,
  headline,
  headlineCta,
  plxImg,
  ctas,
}: HeroProps) {
  return (
    <>
      <section className="absolute inset-0 top-0 z-10 flex w-full place-items-center justify-center">
        <ParallaxImage
          src={plxImg.src} //"/poses/jump.webp"
          alt={plxImg.alt}
        />
      </section>

      <Grid>
        <WhoCell>
          <Who className={CondeSans.className}>{title}</Who>
        </WhoCell>

        <WhatCell>
          <What className={WildWorld.className}>{headline}</What>
          {headlineCta && (
            <div className="ml-4 mt-4 flex flex-col items-end font-medium">
              <span className="block h-0.5 w-1/2 bg-[var(--foreground)]" />
              <button>
                <a
                  href={headlineCta.href}
                  target={headlineCta.target}
                  rel={headlineCta.rel}
                  className="underline-offset-4 hover:underline text-[var(--foreground)] text-2xl"
                >
                  {headlineCta.label}
                </a>
              </button>
              <span className="block h-0.5 w-full bg-[var(--foreground)]" />
            </div>
          )}
        </WhatCell>

        <CtaCell>
          <CtaGroup>
            {ctas.map((cta) => (
              <CtaButton
                className="glassButton"
                key={cta.label}
                href={cta.href}
                target={cta.target}
                rel={cta.rel}
              >
                {cta.label}
              </CtaButton>
            ))}
          </CtaGroup>
        </CtaCell>
      </Grid>
    </>
  );
}
