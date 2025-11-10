import React from "react";
import { Card, Description, Inner, Shell, Title } from "./ui";
export interface FormShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export default function FormShell({ title, description, children }: FormShellProps) {
  return (
    <Shell>
      <Card>
        <Inner>
          <Title>{title}</Title>
          <Description>{description}</Description>
          {children}
        </Inner>
      </Card>
    </Shell>
  );
}
