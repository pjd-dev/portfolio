"use client";
import type { HeroSection } from "@/lib/validation/section";
import ParallaxImage from "../../composites/parallaxImg";
import { AppLink } from "../../navigation/AppLink";
import {
  CtaCell,
  CtaGroup,
  Grid,
  HeroShell,
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
  return (
    <HeroShell>
      {plxImg && (
        <ParallaxeWrapper>
          <ParallaxImage
            src={plxImg.src} //"/poses/jump.webp"
            alt={plxImg?.alt || "parallaxe image alt"}
          />
        </ParallaxeWrapper>
      )}

      <Grid>
        <WhoCell>
          <Who>{title}</Who>
        </WhoCell>

        <WhatCell>
          <What>{headline}</What>
          {headlineCta && (
            <div className="mt-4 ml-4 flex flex-col items-end font-medium">
              {/* <span className="block h-0.5 w-1/2 bg-[var(--foreground)]" /> */}
              <AppLink cta={{ ...headlineCta, variant: "superlink" }} size={"lg"} />
            </div>
          )}
        </WhatCell>
        {ctas && (
          <CtaCell>
            <CtaGroup>
              {ctas.map((cta) => (
                <AppLink key={cta.label} cta={{ ...cta, variant: "solid" }} />
              ))}
            </CtaGroup>
          </CtaCell>
        )}
      </Grid>
    </HeroShell>
  );
}
