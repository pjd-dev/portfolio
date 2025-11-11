"use client";
// src/components/navigation/AppLink.tsx
import { createCtaButton } from "@/components/ui/createCtaButton";
import type { ActionCta, Cta } from "@/lib/validation/shared/ctaSchema";
import type { MouseEvent, ReactNode } from "react";
import { AppLinkBase, type AppLinkBaseProps } from "./AppLinkBase";

// Style-enhanced components
const StyledAppLink = createCtaButton(AppLinkBase);
const StyledActionButton = createCtaButton("button");

type StyledAppLinkProps = React.ComponentProps<typeof StyledAppLink>;
type StyledActionButtonProps = React.ComponentProps<typeof StyledActionButton>;

type SizeProp = StyledAppLinkProps["size"];
type FullWidthProp = StyledAppLinkProps["fullWidth"];
type VariantProp = StyledAppLinkProps["variant"]; // "primary" | "secondary" | "link"

type LinkExtras = Omit<AppLinkBaseProps, "href" | "children">;

export interface AppLinkProps {
  cta: Cta;
  /**
   * Extra link props (lang, prefetch, aria-*, data-*, etc.).
   * Typed from AppLinkBaseProps to avoid re-declaring.
   */
  linkProps?: LinkExtras;
  size?: SizeProp;
  fullWidth?: FullWidthProp;
  className?: string;
  renderIcon?: (icon: string) => ReactNode;
  onAction?: (action: ActionCta["action"], payload?: ActionCta["payload"]) => void;
  onClick?: (event: MouseEvent<HTMLElement>) => void;
}

export function AppLink({
  cta,
  linkProps,
  size,
  fullWidth,
  className,
  renderIcon,
  onAction,
  onClick,
}: AppLinkProps) {
  const variant: VariantProp = cta.variant ?? "ghost";

  const iconNode = cta.icon && renderIcon ? renderIcon(cta.icon) : null;

  const content = (
    <>
      {iconNode}
      <span>{cta.label}</span>
    </>
  );

  // ACTION CTA → button
  if (cta.type === "action") {
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      onAction?.(cta.action, cta.payload);
    };

    const actionProps: StyledActionButtonProps = {
      type: "button",
      variant,
      size,
      fullWidth,
      className,
      onClick: handleClick,
    };

    return <StyledActionButton {...actionProps}>{content}</StyledActionButton>;
  }

  // INTERNAL / EXTERNAL CTA → StyledAppLink
  const href = cta.href;
  const isExternal = cta.type === "external";

  const { lang, prefetch, ...restLinkProps } = linkProps ?? {};

  const linkComponentProps: StyledAppLinkProps = {
    href,
    external: isExternal,
    lang,
    prefetch,
    variant,
    size,
    fullWidth,
    className,
    onClick,
    children: content,
    ...(cta.type === "external"
      ? {
          target: cta.target,
          rel: cta.rel,
        }
      : {}),
    ...restLinkProps,
  };

  return <StyledAppLink {...linkComponentProps} />;
}
