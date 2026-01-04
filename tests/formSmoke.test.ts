import { POST } from "@/app/api/form/route";
import contactDict from "@/app/dictionaries/en/page/contact.json";
import workWithMeDict from "@/app/dictionaries/en/page/work-with-me.json";
import type { FormSection } from "@/lib/validation/section";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dictionary", () => ({
  getSectionById: vi.fn(),
}));

vi.mock("@/lib/mail/sender", () => ({
  sendJsonValuesEmail: vi.fn(),
}));

vi.mock("@/lib/integrations/airtable", () => ({
  sendAirtableRecord: vi.fn(),
}));

const { getSectionById } = await import("@/lib/dictionary");
const { sendJsonValuesEmail } = await import("@/lib/mail/sender");
const { sendAirtableRecord } = await import("@/lib/integrations/airtable");

const contactFormSection = contactDict.sections.find(
  (section) => section.kind === "form" && section.id === "contact_form_en",
) as FormSection | undefined;
const workWithMeFormSection = workWithMeDict.sections.find(
  (section) => section.kind === "form" && section.id === "work_with_me_form",
) as FormSection | undefined;

if (!contactFormSection) {
  throw new Error("Contact form section not found in dictionary");
}
if (!workWithMeFormSection) {
  throw new Error("Work-with-me form section not found in dictionary");
}

describe("Contact form smoke submission", () => {
  const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  beforeAll(() => {
    infoSpy.mockClear();
    warnSpy.mockClear();
    errorSpy.mockClear();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSectionById).mockResolvedValue(contactFormSection);
    vi.mocked(sendJsonValuesEmail).mockResolvedValue({ success: true });
    vi.mocked(sendAirtableRecord).mockResolvedValue({ success: true });
  });

  afterAll(() => {
    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("accepts a valid contact payload", async () => {
    const validData = {
      sectionId: contactFormSection.id,
      lang: "en",
      page: "contact",
      values: {
        name: "Test User",
        email: "test.user@example.com",
        message: "Hello, this is a smoke test message.",
        privacy: true,
      },
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendJsonValuesEmail).toHaveBeenCalled();
    expect(sendAirtableRecord).not.toHaveBeenCalled();
  });

  it("rejects invalid contact payload", async () => {
    const invalidData = {
      sectionId: contactFormSection.id,
      lang: "en",
      page: "contact",
      values: {
        name: "Test User",
        email: "not-an-email",
        message: "short",
      },
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
    expect(data.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "email" }),
        expect.objectContaining({ path: "message" }),
      ]),
    );
    expect(sendJsonValuesEmail).not.toHaveBeenCalled();
    expect(sendAirtableRecord).not.toHaveBeenCalled();
  });
});

describe("Work-with-me form airtable smoke submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(sendJsonValuesEmail).mockResolvedValue({ success: true });
    vi.mocked(sendAirtableRecord).mockResolvedValue({ success: true });
  });

  it("routes submissions to Airtable when delivery is airtable", async () => {
    const airtableSection: FormSection = {
      ...workWithMeFormSection,
      meta: {
        ...workWithMeFormSection.meta,
        delivery: "airtable",
        airtable: {
          baseId: "base_test",
          table: "WorkWithMe",
        },
      },
    };

    vi.mocked(getSectionById).mockResolvedValue(airtableSection);

    const validData = {
      sectionId: workWithMeFormSection.id,
      lang: "en",
      page: "work-with-me",
      values: {
        name: "Test User",
        email: "test.user@example.com",
        engagement: "freelance",
        message: "I need help on a web app rebuild.",
        privacy: true,
      },
    };

    const request = new NextRequest("http://localhost:3000/api/form", {
      method: "POST",
      body: JSON.stringify(validData),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(sendJsonValuesEmail).not.toHaveBeenCalled();
    expect(sendAirtableRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        baseId: "base_test",
        table: "WorkWithMe",
        fields: expect.objectContaining({
          sectionId: workWithMeFormSection.id,
          page: "work-with-me",
          lang: "en",
        }),
      }),
    );
  });
});
