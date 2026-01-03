"use client";

import type { ButtonHTMLAttributes, FC } from "react";
import { SubmitButton } from "../SubmitButton.styles";

type SubmitProps = {
  submitting?: boolean;
  loadingLabel?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Submit: FC<SubmitProps> = ({
  submitting,
  loadingLabel = "Sending...",
  children,
  ...rest
}) => (
  <SubmitButton type="submit" {...rest}>
    {submitting ? loadingLabel : children}
  </SubmitButton>
);
