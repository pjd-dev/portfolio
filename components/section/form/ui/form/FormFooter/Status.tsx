"use client";

import type { FC, ReactNode } from "react";

import type { FormState } from "../shared.d";
import { StatusBarRoot, StatusLabel, StatusText } from "./ui";

type StatusProps = {
  visible: boolean;
  tone?: FormState;
  children: ReactNode;
};

export const Status: FC<StatusProps> = ({ visible, tone = "idle", children }) => (
  <StatusBarRoot visible={visible} tone={tone}>
    {visible && (
      <>
        <StatusLabel>
          {tone === "error" ? "Erreur" : tone === "success" ? "Succès" : "Info"}
        </StatusLabel>
        <StatusText>{children}</StatusText>
      </>
    )}
  </StatusBarRoot>
);
