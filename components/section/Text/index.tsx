"use client";

import type { TextSection } from "@/lib/validation/section";
import { AppLink } from "@/components/navigation/AppLink";
import { SectionInner, SectionOuter } from "@/components/ui";
import { Markdown } from "@/components/composites/Markdown";
import { TextContent, TextCtas, TextShell, TextTitle } from "./ui";

export function Text({ title, content, ctas, variant }: TextSection) {
  return (
    <SectionOuter>
      <SectionInner layout="single" align="center">
        <TextShell variant={variant}>
          {title && <TextTitle>{title}</TextTitle>}
          {content && (
            <TextContent>
              <Markdown content={content} />
            </TextContent>
          )}
          {ctas && ctas.length > 0 && (
            <TextCtas>
              {ctas.map((cta) => (
                <AppLink key={cta.label} cta={{ ...cta, variant: "solid" }} />
              ))}
            </TextCtas>
          )}
        </TextShell>
      </SectionInner>
    </SectionOuter>
  );
}
