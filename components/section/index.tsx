// components/sections/SectionRenderer.tsx
"use client";
import type { Sections } from "@/lib/validation/pageDictionarySchema";
import type { ReactElement } from "react";
import { Wrapper } from "../ui";
import { Hero } from "./Hero";
import { Legal } from "./Legal";
// import others as needed
// import { FeatureGridSection } from "./FeatureGridSection";
// import { CtaSection } from "./CtaSection";
type SectionKind = "hero" | "legal";
// type SectionComponentProps = { section: Sections };
type AnySectionComponent = (props: any) => ReactElement | null;

const SECTION_COMPONENTS: Record<SectionKind, AnySectionComponent> = {
  hero: Hero as AnySectionComponent,
  legal: Legal as AnySectionComponent,
  // form: null,
};

type SectionRendererProps = {
  sections: Sections[];
};

export function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <Wrapper>
      {sections.map((section) => {
        const Component = SECTION_COMPONENTS[section.kind];

        if (!Component) {
          // optional: log in dev
          if (process.env.NODE_ENV !== "production") {
            console.warn(`No renderer for section kind: ${section.kind}`);
          }
          return null;
        }

        // TS narrows by kind inside the component, which expects the specific type
        return <Component key={section.id} {...section} />;
      })}
    </Wrapper>
  );
}
