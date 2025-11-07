// components/legal/LegalDocumentPage.tsx
"use client";
import {
  LegalShell,
  LegalHeader,
  LegalTitle,
  LegalMeta,
  LegalFooter,
  LegalScroll,
  LegalBlur,
} from "../ui";
import { Markdown } from "../Markdown";
type LegalDocumentPageProps = {
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
