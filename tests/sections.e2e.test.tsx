import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Hero } from "@/components/section/Hero";
import { Legal } from "@/components/section/Legal";
import { Form } from "@/components/section/form";
import { SectionRenderer } from "@/components/section";
import type {
  FormSection,
  HeroSection,
  LegalSection,
} from "@/lib/validation/section";

vi.mock("../components/composites/ParallaxeImg", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} />
  ),
}));

vi.mock("../components/navigation/AppLink", () => ({
  AppLink: ({ cta }: { cta: { label: string } }) => <a>{cta.label}</a>,
}));

describe("Section components", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const heroSection: HeroSection = {
    id: "hero",
    kind: "hero",
    title: "Jean Paulette",
    headline: "Full-stack developer",
    headlineCta: {
      type: "internal",
      href: "/contact",
      label: "Contact me",
    },
    ctas: [
      {
        type: "external",
        href: "https://example.com",
        label: "Portfolio",
      },
    ],
    plxImg: {
      src: "/hero.png",
      alt: "Hero image",
    },
  };

  const legalSection: LegalSection = {
    id: "terms",
    kind: "legal",
    title: "Terms",
    lastUpdated: "2025-01-01",
    content: "Welcome **friend**.",
    note: "Footer note",
  };

  const formSection: FormSection = {
    id: "contact_form_en",
    kind: "form",
    title: "Contact",
    description: "Send a message",
    meta: {
      api: {
        endpoint: "/api/form",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      successRedirect: null,
      captcha: false,
      delivery: "mail",
    },
    messages: {
      submit: "Send message",
    },
    fields: [
      {
        id: "name",
        name: "name",
        label: "Name",
        type: "text",
        width: "full",
        errors: [{ rule: { type: "required" }, message: "Name required" }],
      },
    ],
    submit: "Send message",
  };

  beforeAll(() => {
    consoleError.mockClear();
    consoleWarn.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });

  it("renders the hero section content", () => {
    render(<Hero {...heroSection} />);

    expect(screen.getByText("Jean Paulette")).toBeInTheDocument();
    expect(screen.getByText("Full-stack developer")).toBeInTheDocument();
    expect(screen.getByText("Contact me")).toBeInTheDocument();
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
    expect(screen.getByAltText("Hero image")).toBeInTheDocument();
  });

  it("renders the legal section content", () => {
    render(<Legal {...legalSection} />);

    expect(screen.getByText("Terms")).toBeInTheDocument();
    expect(screen.getByText("Dernière mise à jour : 2025-01-01")).toBeInTheDocument();
    expect(screen.getByText(/Welcome/)).toBeInTheDocument();
    expect(screen.getByText("Footer note")).toBeInTheDocument();
  });

  it("renders the form section content", () => {
    render(<Form {...formSection} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByAltText("Placeholder")).toBeInTheDocument();
  });

  it("renders sections via SectionRenderer", () => {
    render(<SectionRenderer sections={[heroSection, legalSection, formSection]} />);

    expect(screen.getByText("Jean Paulette")).toBeInTheDocument();
    expect(screen.getByText("Terms")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });
});
