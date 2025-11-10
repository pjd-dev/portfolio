// lib/validation/section/textDictionarySchema.ts
import { baseSectionSchema } from "@/lib/validation/shared/baseSectionSchema";
import { ctaSchema } from "@/lib/validation/shared/ctaSchema";
import { z } from "zod";

export const textSectionSchema = baseSectionSchema.extend({
  kind: z.literal("text"),
  title: z.string().optional(),
  content: z.string().optional(), // can be long markdown or plain text
  variant: z.enum(["default", "muted", "small", "legal"]).optional(),
  ctas: z.array(ctaSchema).default([]),
});

// TypeScript type inference
export type TextSection = z.infer<typeof textSectionSchema>;
