import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/schemas/contact";
import { sendContactEmail } from "@/lib/mail";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const validatedData = contactSchema.parse(body);

    // Send email
    const result = await sendContactEmail(validatedData);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error || "Failed to send email" },
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
