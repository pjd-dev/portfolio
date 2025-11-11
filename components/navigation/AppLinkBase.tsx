"use client";
// src/components/navigation/AppLinkBase.tsx
import Link from "next/link";
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

export interface AppLinkBaseProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  lang?: Locale;
  external?: boolean;
  prefetch?: boolean;
}

const isExternalHref = (href: string): boolean =>
  href.startsWith("http://") ||
  href.startsWith("https://") ||
  href.startsWith("mailto:") ||
  href.startsWith("tel:");

const withLocale = (href: string, lang?: Locale): string => {
  if (!lang) return href;
  if (!href.startsWith("/")) return href;

  if (href === "/en" || href.startsWith("/en/")) return href;
  if (href === "/fr" || href.startsWith("/fr/")) return href;

  return `/${lang}${href}`;
};

export const AppLinkBase = forwardRef<HTMLAnchorElement, AppLinkBaseProps>(
  ({ href, lang, external, prefetch, children, target, rel, ...rest }, ref) => {
    const localizedHref = withLocale(href, lang);
    const isExternal = external ?? isExternalHref(localizedHref);

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={localizedHref}
          target={target ?? "_blank"}
          rel={rel ?? "noopener noreferrer"}
          {...rest}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={localizedHref} prefetch={prefetch} ref={ref} {...rest}>
        {children}
      </Link>
    );
  },
);

AppLinkBase.displayName = "AppLinkBase";
