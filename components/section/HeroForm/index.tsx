"use client";

import type { HeroFormSection } from "@/lib/validation/section";
import ParallaxImage from "@/components/composites/ParallaxeImg";
import { AppLink } from "@/components/navigation/AppLink";
import { FormRenderer } from "../form/FormRenderer";
import {
  HeroFormCta,
  HeroFormFormCell,
  HeroFormFormSlot,
  HeroFormGrid,
  HeroFormHeadline,
  HeroFormHeadlineCell,
  HeroFormImageCell,
  HeroFormShell,
  HeroFormTitle,
  HeroFormTitleCell,
} from "./ui";

export type HeroFormProps = HeroFormSection;

export function HeroForm({
  id,
  title,
  headline,
  headlineCta,
  plxImg,
  form,
}: HeroFormProps) {
  const formConfig = {
    ...form,
    id: form.id ?? id ?? "form",
    kind: "form" as const,
  };
  const hasHeadline = Boolean(headline?.trim() || headlineCta);

  return (
    <HeroFormShell>
      <HeroFormGrid hasHeadline={hasHeadline}>
        <HeroFormTitleCell>
          <HeroFormTitle>{title}</HeroFormTitle>
        </HeroFormTitleCell>

        {plxImg?.src ? (
          <HeroFormImageCell>
            <ParallaxImage
              src={plxImg.src}
              alt={plxImg.alt ?? "Parallax figure"}
              speed={0.35}
              maxShift={120}
              mouseFollowStrength={0.35}
            />
          </HeroFormImageCell>
        ) : null}

        {hasHeadline ? (
          <HeroFormHeadlineCell>
            {headline?.trim() ? <HeroFormHeadline>{headline}</HeroFormHeadline> : null}
            {headlineCta && (
              <HeroFormCta>
                <AppLink cta={{ ...headlineCta, variant: "superlink" }} size="lg" />
              </HeroFormCta>
            )}
          </HeroFormHeadlineCell>
        ) : null}

        <HeroFormFormCell>
          <HeroFormFormSlot>
            <FormRenderer config={formConfig} />
          </HeroFormFormSlot>
        </HeroFormFormCell>
      </HeroFormGrid>
    </HeroFormShell>
  );
}
