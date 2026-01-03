import { NextRequest, NextResponse } from "next/server";

// import { sendContactEmail } from "@/lib/mail";
import { getSectionById } from "@/lib/dictionary";
import { sendAirtableRecord } from "@/lib/integrations/airtable";
import { createFormSchema } from "@/lib/validation/generateSchemaFromDict";
import type { FormSection } from "@/lib/validation/section";
import { ZodError } from "zod";

import { sendJsonValuesEmail } from "@/lib/mail/sender";

type DeliveryMode = "mail" | "airtable" | "mail+airtable";
type DeliveryHandler = "mail" | "airtable";
type DeliveryResult = { handler: DeliveryHandler; success: boolean; error?: string };

function sanitizePageSlug(page: string): string {
  const trimmed = page.trim();
  const withoutQuery = trimmed.split(/[?#]/)[0];
  return withoutQuery.replace(/^\/+/, "").replace(/\/+$/, "");
}

function resolveDeliveryHandlers(mode?: string | null): DeliveryHandler[] {
  switch (mode) {
    case "airtable":
      return ["airtable"];
    case "mail+airtable":
      return ["mail", "airtable"];
    case "mail":
    default:
      return ["mail"];
  }
}

function createSubmissionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { sectionId, lang, page, values } = body;
    if (!sectionId || !lang || !page || !values) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields in request body" },
        { status: 400 },
      );
    }

    const pageSlug = sanitizePageSlug(page);
    const pageKey = pageSlug || "landing";
    const pageLabel = pageSlug || "Untitled Form";
    console.info("Form submission received", {
      sectionId,
      lang,
      page: pageLabel,
      fieldCount: Object.keys(values ?? {}).length,
    });

    const FormSectionDict = (await getSectionById({
      locale: lang,
      target: pageKey,
      sectionId,
    })) as FormSection | null;

    if (!FormSectionDict) {
      return NextResponse.json(
        { ok: false, error: "Form section not found" },
        { status: 404 },
      );
    }

    const formSchema = createFormSchema(FormSectionDict);

    const validatedData = formSchema.parse(values);

    const emailSubject = `New form submission: ${pageLabel}`;
    const emailPreheader = `New submission from : ${sectionId || "Unknown Section"} at ${new Date().toLocaleString()}`;

    const deliveryMode = (FormSectionDict.meta?.delivery ??
      "mail") as DeliveryMode;
    const handlers = resolveDeliveryHandlers(deliveryMode);
    const results: DeliveryResult[] = [];

    if (handlers.includes("mail")) {
      const mailResult = await sendJsonValuesEmail(
        emailSubject,
        emailPreheader,
        validatedData,
      );
      results.push({ handler: "mail", ...mailResult });
    }

    if (handlers.includes("airtable")) {
      const airtableResult = await sendAirtableRecord({
        baseId: FormSectionDict.meta?.airtable?.baseId,
        table: FormSectionDict.meta?.airtable?.table,
        fields: {
          ...validatedData,
          sectionId,
          page: pageKey,
          lang,
          submittedAt: new Date().toISOString(),
          submissionId: createSubmissionId(),
        },
      });
      results.push({ handler: "airtable", ...airtableResult });
    }

    const failures = results.filter((result) => !result.success);
    if (failures.length === results.length) {
      return NextResponse.json(
        {
          ok: false,
          error:
            failures[0]?.error ||
            "Form submission failed in all configured handlers",
        },
        { status: 500 },
      );
    }

    if (failures.length > 0) {
      console.warn("Form submission partially failed", {
        failures,
        deliveryMode,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        warnings: failures.map((failure) => ({
          handler: failure.handler,
          error: failure.error,
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json(
        { ok: false, error: "Validation failed", issues },
        { status: 400 },
      );
    }

    // Handle other errors
    console.log("Form API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
