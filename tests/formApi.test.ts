import { POST } from "@/app/api/form/route";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";

import type { FormSection } from "@/lib/validation/section";
// Mock the dictionary module
vi.mock("@/lib/dictionary", () => ({
  getSectionById: vi.fn(),
}));

// Mock the validation module
vi.mock("@/lib/validation/generateSchemaFromDict", () => ({
  createFormSchema: vi.fn(),
}));

const { getSectionById } = await import("@/lib/dictionary");
const { createFormSchema } = await import("@/lib/validation/generateSchemaFromDict");

describe("Form API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 200 for valid form data", async () => {
    const mockFormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          width: "full",
          errors: [{ rule: { type: "required" }, message: "Name is required" }],
        },
        {
          id: "email",
          type: "email",
          label: "Email",
          width: "full",
          errors: [{ rule: { type: "email" }, message: "Invalid email" }],
        },
      ],
    } as FormSection;

    vi.mocked(getSectionById).mockResolvedValue(mockFormSection);
    const mockSchema = {
      parse: vi.fn().mockReturnValue({ name: "John Doe", email: "john@example.com" }),
    };
    vi.mocked(createFormSchema).mockReturnValue(
      mockSchema as unknown as ReturnType<typeof createFormSchema>,
    );

    const validData = {
      sectionId: "contactForm",
      lang: "en",
      page: "contact",
      values: { name: "John Doe", email: "john@example.com" },
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(getSectionById).toHaveBeenCalledWith({
      locale: "en",
      target: "contact",
      sectionId: "contactForm",
    });
    expect(createFormSchema).toHaveBeenCalledWith(mockFormSection);
    expect(mockSchema.parse).toHaveBeenCalledWith(validData.values);
  });

  it("should return 400 for missing required fields in request body", async () => {
    const invalidData = {
      sectionId: "contactForm",
      lang: "en",
      // missing page and values
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("Missing required fields in request body");
  });

  it("should return 404 for form section not found", async () => {
    vi.mocked(getSectionById).mockResolvedValue(null);

    const validData = {
      sectionId: "nonexistent",
      lang: "en",
      page: "contact",
      values: { name: "John Doe" },
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("Form section not found");
  });

  it("should return 400 for Zod validation errors", async () => {
    const mockFormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email",
          width: "full",
          errors: [{ rule: { type: "email" }, message: "Invalid email" }],
        },
      ],
    } as FormSection;

    vi.mocked(getSectionById).mockResolvedValue(mockFormSection);
    const zodError = new ZodError([
      {
        code: "custom",
        // validation: "email",
        path: ["email"],
        message: "Invalid email",
      },
    ]);
    const mockSchema = {
      parse: vi.fn().mockImplementation(() => {
        throw zodError;
      }),
    };
    vi.mocked(createFormSchema).mockReturnValue(
      mockSchema as unknown as ReturnType<typeof createFormSchema>,
    );

    const invalidData = {
      sectionId: "contactForm",
      lang: "en",
      page: "contact",
      values: { email: "invalid-email" },
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
    expect(data.issues).toEqual([
      {
        path: "email",
        message: "Invalid email",
      },
    ]);
  });

  it("should return 500 for other errors", async () => {
    const mockFormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "email",
          type: "email",
          label: "Email",
          width: "full",
          errors: [{ rule: { type: "email" }, message: "Invalid email" }],
        },
      ],
    } as FormSection;

    vi.mocked(getSectionById).mockResolvedValue(mockFormSection);
    const mockSchema = {
      parse: vi.fn().mockImplementation(() => {
        throw new Error("Some other error");
      }),
    };
    vi.mocked(createFormSchema).mockReturnValue(
      mockSchema as unknown as ReturnType<typeof createFormSchema>,
    );

    const invalidData = {
      sectionId: "contactForm",
      lang: "en",
      page: "contact",
      values: { email: "invalid-email" },
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(invalidData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.ok).toBe(false);
    expect(data.error).toBe("Some other error");
  });

  it("should allow missing fields with showWhen", async () => {
    const mockFormSection = {
      kind: "form",
      meta: {},
      fields: [
        {
          id: "name",
          type: "text",
          label: "Name",
          width: "full",
          errors: [{ rule: { type: "required" }, message: "Name is required" }],
        },
        {
          id: "conditionalField",
          type: "text",
          label: "Conditional Field",
          width: "full",
          showWhen: { mode: "and", conditions: [] },
          errors: [{ rule: { type: "required" }, message: "Required" }],
        },
      ],
    } as FormSection;

    vi.mocked(getSectionById).mockResolvedValue(mockFormSection);
    const mockSchema = {
      parse: vi.fn().mockReturnValue({ name: "John Doe", conditionalField: undefined }),
    };

    vi.mocked(createFormSchema).mockReturnValue(
      mockSchema as unknown as ReturnType<typeof createFormSchema>,
    );

    const validData = {
      sectionId: "contactForm",
      lang: "en",
      page: "contact",
      values: { name: "John Doe" }, // conditionalField is missing
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(mockSchema.parse).toHaveBeenCalledWith(validData.values);
  });
});
