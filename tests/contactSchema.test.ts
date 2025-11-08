import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/schemas/contact";

describe("contactSchema", () => {
  it("should validate basic recruitment form data", () => {
    const validData = {
      name: "John Doe",
      email: "john@example.com",
      subject: "recruitment" as const,
      message: "I am interested in a position.",
    };

    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate freelance form with required fields", () => {
    const validData = {
      name: "Jane Smith",
      email: "jane@example.com",
      subject: "freelance" as const,
      company: "Tech Corp",
      budget: "$5,000 - $10,000",
      deadline: "2 weeks",
      message: "We have a project for you.",
    };

    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should validate collab form with required fields", () => {
    const validData = {
      name: "Bob Johnson",
      email: "bob@example.com",
      subject: "collab" as const,
      projectLink: "https://example.com/project",
      goal: "Build a great product together",
      message: "Let's collaborate!",
    };

    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      subject: "recruitment" as const,
      message: "Test message",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("email");
    }
  });

  it("should reject name that's too short", () => {
    const invalidData = {
      name: "J",
      email: "john@example.com",
      subject: "recruitment" as const,
      message: "Test message",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("should reject message that's too short", () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
      subject: "recruitment" as const,
      message: "Short",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("message");
    }
  });

  it("should reject freelance without company", () => {
    const invalidData = {
      name: "Jane Smith",
      email: "jane@example.com",
      subject: "freelance" as const,
      message: "We have a project.",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject collab without projectLink", () => {
    const invalidData = {
      name: "Bob Johnson",
      email: "bob@example.com",
      subject: "collab" as const,
      message: "Let's work together.",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should reject invalid URL for projectLink", () => {
    const invalidData = {
      name: "Bob Johnson",
      email: "bob@example.com",
      subject: "collab" as const,
      projectLink: "not-a-url",
      goal: "Build something",
      message: "Let's collaborate!",
    };

    const result = contactSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("projectLink");
    }
  });

  it("should accept 'other' subject without extra fields", () => {
    const validData = {
      name: "Alice Brown",
      email: "alice@example.com",
      subject: "other" as const,
      message: "Just saying hello!",
    };

    const result = contactSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
