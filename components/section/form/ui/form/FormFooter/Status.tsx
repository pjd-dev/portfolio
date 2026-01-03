"use client";

import type { FC, ReactNode } from "react";

import type { FormState } from "../shared.d";
import { StatusBarRoot, StatusLabel, StatusText } from "./ui";

type StatusProps = {
  visible: boolean;
  tone?: FormState;
  label?: string;
  children: ReactNode;
};

const resolveDefaultLabel = (tone: FormState) =>
  tone === "error"
    ? "Error"
    : tone === "success"
      ? "Success"
      : tone === "validation"
        ? "Validation"
        : "Info";

export const Status: FC<StatusProps> = ({
  visible,
  tone = "idle",
  label,
  children,
}) => (
  <StatusBarRoot visible={visible} tone={tone}>
    {visible && (
      <>
        <StatusLabel>{label ?? resolveDefaultLabel(tone)}</StatusLabel>
        <StatusText>{children}</StatusText>
      </>
    )}
  </StatusBarRoot>
);
