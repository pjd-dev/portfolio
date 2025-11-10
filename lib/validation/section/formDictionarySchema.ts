// lib/validation/section/formDictionarySchema.ts
import { z } from "zod";

import { baseSectionSchema } from "../shared/baseSectionSchema";
import { ctaSchema } from "../shared/ctaSchema";
import { sectionMessagesSchema, sectionMetaSchema } from "../shared/sectionSchema";

/* Form field + section */

export const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["text", "textarea", "email", "url", "select"]).default("text"),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  width: z.enum(["full", "1/2", "1/3"]).default("full"),
  rows: z.number().optional(),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .optional(),
  showWhen: z.object({ subject: z.array(z.string()).optional() }).optional(),
  messages: z.record(z.string(), z.string()).optional(),
});

export const formSectionSchema = baseSectionSchema.extend({
  kind: z.literal("form"),
  meta: sectionMetaSchema.optional(),
  messages: sectionMessagesSchema.optional(),
  fields: z.array(fieldSchema),
  ctas: z.array(ctaSchema).default([]),
  privacy: z.string().optional(),
  submit: z.string().optional(),
});
// TypeScript type inference
export type FormSection = z.infer<typeof formSectionSchema>;
export type FormSectionField = z.infer<typeof fieldSchema>;
