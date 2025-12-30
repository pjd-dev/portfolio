// components/sections/SectionRenderer.tsx
"use client";
import type { Sections } from "@/lib/validation/pageDictionarySchema";
import type { ReactElement } from "react";
import { Wrapper } from "../ui";
import { Hero } from "./Hero";
import { Legal } from "./Legal";
import { Form } from "./form";

// import others as needed
// import { FeatureGridSection } from "./FeatureGridSection";
// import { CtaSection } from "./CtaSection";
type SectionKind = "hero" | "legal" | "form";
// type SectionComponentProps = { section: Sections };
type AnySectionComponent = (props: Sections) => ReactElement | null;

const SECTION_COMPONENTS: Record<SectionKind, AnySectionComponent> = {
  hero: Hero as AnySectionComponent,
  legal: Legal as AnySectionComponent,
  form: Form as AnySectionComponent,
};

type SectionRendererProps = {
  sections: Sections[];
};

export function SectionRenderer({ sections }: SectionRendererProps) {
  return (
    <Wrapper>
      {sections.map((section, index) => {
        const Component = SECTION_COMPONENTS[section.kind];

        if (!Component) {
          // optional: log in dev
          if (process.env.NODE_ENV !== "production") {
            console.warn(`No renderer for section kind: ${section.kind}`);
          }
          return null;
        }

        // TS narrows by kind inside the component, which expects the specific type
        const key = section.id ?? `${section.kind}-${index}`;
        return <Component key={key} {...section} />;
      })}
    </Wrapper>
  );
}
