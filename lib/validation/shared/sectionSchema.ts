// lib/validation/shared/sectionSchema.ts
import { z } from "zod";
/* ---------------- Section-level meta (API, captcha, redirect) ---------------- */
export const sectionMetaSchema = z.object({
  api: z
    .object({
      endpoint: z.string(),
      method: z.string().default("POST"),
      headers: z.record(z.string(), z.string()).optional(),
    })
    .optional(),
  successRedirect: z.string().nullable().optional(),
  captcha: z.boolean().optional(),
});
export const sectionMessagesSchema = z
  .object({
    success: z.string().optional(), // e.g. "Message sent successfully."
    error: z.string().optional(), // e.g. "An unexpected error occurred."
    validation: z.string().optional(), // e.g. "Please check the highlighted fields."
    loading: z.string().optional(), // e.g. "Sending..."
    empty: z.string().optional(), // optional, for list or text sections
    info: z.string().optional(), // optional, for hints
    submit: z.string().optional(), // e.g. "Submit"
  })
  .default({});

// TypeScript type inference
export type SectionMetaSchema = z.infer<typeof sectionMetaSchema>;
export type SectionMessagesSchema = z.infer<typeof sectionMessagesSchema>;
