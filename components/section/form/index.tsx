import React from "react";
import { FormWrapper, Shell } from "./ui";
export interface FormShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function Form({ title, description, children }: FormShellProps) {
  return (
    <FormWrapper>
      <Shell>
        {/* <Card>
        <Inner>
          <Title>{title}</Title>
          <Description>{description}</Description>
          {children}
        </Inner>
      </Card> */}
      </Shell>
    </FormWrapper>
  );
}
