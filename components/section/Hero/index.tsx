import type { HeroSection } from "@/lib/validation/section";
import clsx from "clsx";
import ParallaxImage from "../../composites/parallaxImg";
import { AppLink } from "../../navigation/AppLink";
import { CondeSans, WildWorld } from "../../ui/fonts";
import {
  CtaCell,
  CtaGroup,
  Grid,
  ParallaxeWrapper,
  What,
  WhatCell,
  Who,
  WhoCell,
} from "./ui";

export type HeroProps = HeroSection & {
  classNames: {
    parallaxe?: {
      wrapper?: string;
      img?: string;
    };
    grid?: string;
    who?: {
      cell?: string;
      self?: string;
    };
    what?: {
      cell?: string;
      self?: string;
    };
    cta?: {
      cell?: string;
      self?: string;
      group?: string;
    };
  };
};

export function Hero({
  title,
  headline,
  headlineCta,
  plxImg,
  ctas,
  classNames,
}: HeroProps) {
  const { parallaxe, grid, who, what } = classNames;

  return (
    <>
      {plxImg && (
        <ParallaxeWrapper className={parallaxe && ""}>
          <ParallaxImage
            src={plxImg.src} //"/poses/jump.webp"
            alt={plxImg?.alt || "parallaxe image alt"}
          />
        </ParallaxeWrapper>
      )}

      <Grid className={grid && ""}>
        <WhoCell className={who?.cell && ""}>
          <Who className={clsx([CondeSans.className, who?.self && ""])}>{title}</Who>
        </WhoCell>

        <WhatCell className={what?.cell && ""}>
          <What className={clsx([WildWorld.className, what?.self && ""])}>
            {headline}
          </What>
          {headlineCta && (
            <div className="mt-4 ml-4 flex flex-col items-end font-medium">
              <span className="block h-0.5 w-1/2 bg-[var(--foreground)]" />
              <AppLink cta={headlineCta} />
              <span className="block h-0.5 w-full bg-[var(--foreground)]" />
            </div>
          )}
        </WhatCell>

        <CtaCell className={classNames.cta?.cell && ""}>
          <CtaGroup className={classNames.cta?.group && ""}>
            {ctas.map((cta) => (
              <AppLink cta={cta} className={classNames.cta?.self} />
            ))}
          </CtaGroup>
        </CtaCell>
      </Grid>
    </>
  );
}
