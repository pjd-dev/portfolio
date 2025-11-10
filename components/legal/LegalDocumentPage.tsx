// components/legal/LegalDocumentPage.tsx
"use client";
import { Markdown } from "../composites/Markdown";
import {
  LegalBlur,
  LegalFooter,
  LegalHeader,
  LegalMeta,
  LegalScroll,
  LegalShell,
  LegalTitle,
} from "../ui";
export type LegalDocumentPageProps = {
  title: string;
  lastUpdated: string;
  content: string;
  note?: string;
};

export function LegalDocumentPage({
  title,
  lastUpdated,
  content,
  note,
}: LegalDocumentPageProps) {
  return (
    <LegalShell>
      <LegalBlur position="top" />
      <LegalBlur position="bottom" />
      <LegalScroll>
        <LegalHeader>
          <LegalTitle>{title}</LegalTitle>
          <LegalMeta>Dernière mise à jour : {lastUpdated}</LegalMeta>
        </LegalHeader>
        <Markdown content={content} />
        {note && <LegalFooter>{note}</LegalFooter>}
      </LegalScroll>
    </LegalShell>
  );
}
