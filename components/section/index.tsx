// components/sections/SectionRenderer.tsx
"use client";
import type { Sections } from "@/lib/validation/pageDictionarySchema";
import type { ReactElement } from "react";
import { useRef } from "react";
import { ScrollAssist, Wrapper } from "../ui";
import { Hero } from "./Hero";
import { HeroForm } from "./HeroForm";
import { Legal } from "./Legal";
import { Form } from "./form";
import { Text } from "./Text";

// import others as needed
// import { FeatureGridSection } from "./FeatureGridSection";
// import { CtaSection } from "./CtaSection";
type SectionKind = "hero" | "heroForm" | "legal" | "form" | "text";
// type SectionComponentProps = { section: Sections };
type AnySectionComponent = (props: Sections) => ReactElement | null;

const SECTION_COMPONENTS: Record<SectionKind, AnySectionComponent> = {
  hero: Hero as AnySectionComponent,
  heroForm: HeroForm as AnySectionComponent,
  legal: Legal as AnySectionComponent,
  form: Form as AnySectionComponent,
  text: Text as AnySectionComponent,
};

type SectionRendererProps = {
  sections: Sections[];
};

export function SectionRenderer({ sections }: SectionRendererProps) {
  const rootRef = useRef<HTMLElement | null>(null);
  return (
    <>
      <Wrapper ref={rootRef}>
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
          return (
            <div key={key} id={section.id} data-section style={{ width: "100%" }}>
              <Component {...section} />
            </div>
          );
        })}
      </Wrapper>
      <ScrollAssist rootRef={rootRef} />
    </>
  );
}
