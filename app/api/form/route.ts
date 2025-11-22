import { NextRequest, NextResponse } from "next/server";

// import { sendContactEmail } from "@/lib/mail";
import { getSectionById } from "@/lib/dictionary";
import { createFormSchema } from "@/lib/validation/generateSchemaFromDict";
import type { FormSection } from "@/lib/validation/section";
import { ZodError } from "zod";

import { sendJsonValuesEmail } from "@/lib/mail/sender";
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    console.log("Received form data:", body);
    const { sectionId, lang, page, values } = body;
    if (!sectionId || !lang || !page || !values) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields in request body" },
        { status: 400 },
      );
    }
    const FormSectionDict = (await getSectionById({
      locale: lang,
      target: page,
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

    const emailSubject = `New form submission: ${page.replace(/^\/+/, "") || "Untitled Form"}`;
    const emailPreheader = `New submission from : ${sectionId || "Unknown Section"} at ${new Date().toLocaleString()}`;

    const sendResult = await sendJsonValuesEmail(
      emailSubject,
      emailPreheader,
      validatedData,
    );

    if (!sendResult.success) {
      return NextResponse.json(
        { ok: false, error: sendResult.error || "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
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
    console.error("Form API error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
