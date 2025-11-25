"use client";

import type { ButtonHTMLAttributes, FC } from "react";
import { SubmitButton } from "../SubmitButton.styles";

type SubmitProps = {
  submitting?: boolean;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const Submit: FC<SubmitProps> = ({ submitting, children, ...rest }) => (
  <SubmitButton type="submit" {...rest}>
    {submitting ? "Envoi..." : children}
  </SubmitButton>
);
