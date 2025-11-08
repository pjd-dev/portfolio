import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/form/route";
import { NextRequest } from "next/server";

// Mock the mail module
vi.mock("@/lib/mail", () => ({
  sendContactEmail: vi.fn(),
}));

const { sendContactEmail } = await import("@/lib/mail");

describe("Form API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for valid recruitment form data", async () => {
    vi.mocked(sendContactEmail).mockResolvedValue({ success: true });

    const validData = {
      name: "John Doe",
      email: "john@example.com",
      subject: "recruitment",
      message: "I am interested in a position.",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendContactEmail).toHaveBeenCalledWith(validData);
  });

  it("should return 200 for valid freelance form data", async () => {
    vi.mocked(sendContactEmail).mockResolvedValue({ success: true });

    const validData = {
      name: "Jane Smith",
      email: "jane@example.com",
      subject: "freelance",
      company: "Tech Corp",
      budget: "$5,000",
      deadline: "2 weeks",
      message: "We have a project.",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it("should return 400 for invalid email", async () => {
    const invalidData = {
      name: "John Doe",
      email: "invalid-email",
      subject: "recruitment",
      message: "Test message",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("Validation failed");
    expect(data.issues).toBeDefined();
    expect(Array.isArray(data.issues)).toBe(true);
  });

  it("should return 400 for missing required fields", async () => {
    const invalidData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.issues).toBeDefined();
  });

  it("should return 400 for freelance without company", async () => {
    const invalidData = {
      name: "Jane Smith",
      email: "jane@example.com",
      subject: "freelance",
      message: "We have a project.",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
  });

  it("should return 500 when email sending fails", async () => {
    vi.mocked(sendContactEmail).mockResolvedValue({
      success: false,
      error: "SMTP error",
    });

    const validData = {
      name: "John Doe",
      email: "john@example.com",
      subject: "recruitment",
      message: "Test message for email failure.",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toBeDefined();
  });

  it("should return validation issues for multiple errors", async () => {
    const invalidData = {
      name: "J",
      email: "invalid",
      subject: "recruitment",
      message: "Short",
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.issues.length).toBeGreaterThan(0);
  });
});
