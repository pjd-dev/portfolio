// components/section/form/ui/FormFooter.tsx
"use client";

import type { FC, ReactNode } from "react";

import { ScrollHintBar } from "./ui";

type ScrollHintProps = {
  visible: boolean;
  children: ReactNode;
};

export const ScrollHint: FC<ScrollHintProps> = ({ visible, children }) => (
  <ScrollHintBar visible={visible}>{visible && children}</ScrollHintBar>
);
