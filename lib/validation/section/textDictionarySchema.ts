// lib/validation/section/textDictionarySchema.ts
import { z } from "zod";
import { ctaSchema } from "@/lib/validation/shared/ctaSchema";
import { baseSectionSchema } from "@/lib/validation/shared/baseSectionSchema";

export const textSectionSchema = baseSectionSchema.extend({
  type: z.literal("text"),
  title: z.string().optional(),
  content: z.string().optional(), // can be long markdown or plain text
  variant: z.enum(["default", "muted", "small", "legal"]).optional(),
  ctas: z.array(ctaSchema).default([]),
});

// TypeScript type inference
export type TextSection = z.infer<typeof textSectionSchema>;
