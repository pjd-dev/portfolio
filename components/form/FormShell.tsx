import React from "react";
import { styled } from "@/stitches.config";

const Shell = styled("div", {
  width: "100%",
  maxWidth: "800px",
  margin: "0 auto",
  padding: "2rem",

  "@media (max-width: 768px)": {
    padding: "1rem",
  },
});

const Card = styled("div", {
  background: "black",
  borderRadius: "24px",
  padding: "2px",
  boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
});

const Inner = styled("div", {
  background: "white",
  borderRadius: "22px",
  padding: "3rem",

  "@media (max-width: 768px)": {
    padding: "2rem 1.5rem",
  },
});

const Title = styled("h1", {
  fontSize: "2.5rem",
  fontWeight: "700",
  marginBottom: "1rem",
  color: "#000",

  "@media (max-width: 768px)": {
    fontSize: "2rem",
  },
});

const Description = styled("p", {
  fontSize: "1.125rem",
  color: "#666",
  marginBottom: "2rem",
  lineHeight: "1.6",

  "@media (max-width: 768px)": {
    fontSize: "1rem",
  },
});

interface FormShellProps {
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
