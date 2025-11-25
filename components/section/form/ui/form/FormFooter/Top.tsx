"use client";

import type { FC, ReactNode } from "react";
import { TopZone } from "./ui";
type TopProps = {
  children: ReactNode;
};

// Wrap top zone so you can keep JSX clean
export const Top: FC<TopProps> = ({ children }) => <TopZone>{children}</TopZone>;
