// components/legal/LegalDocumentPage.tsx
"use client";
import type { LegalSection } from "@/lib/validation/section/legalDictionarySchema";
import { Markdown } from "../../composites/Markdown";
import {
  LegalBlur,
  LegalFooter,
  LegalHeader,
  LegalMeta,
  LegalScroll,
  LegalShell,
  LegalTitle,
  LegalWrapper,
} from "./ui";

export function Legal({ title, lastUpdated, content, note }: LegalSection) {
  return (
    <LegalWrapper>
      <LegalShell>
        <LegalBlur position="top" />
        <LegalBlur position="bottom" />
        <LegalScroll>
          <LegalHeader>
            <LegalTitle>{title}</LegalTitle>
            <LegalMeta>Dernière mise à jour : {lastUpdated}</LegalMeta>
          </LegalHeader>
          {content && <Markdown content={content} />}
          {note && <LegalFooter>{note}</LegalFooter>}
        </LegalScroll>
      </LegalShell>
    </LegalWrapper>
  );
}
