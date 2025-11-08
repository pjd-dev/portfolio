// lib/validation/pageDictionarySchema.ts
import { z } from "zod";
import {
  heroSectionSchema,
  formSectionSchema,
  textSectionSchema,
} from "@/lib/validation/section";
import {
  pageMetaSchema,
  pageMessagesSchema,
  ctaSchema,
} from "@/lib/validation/shared";
export const sectionSchema = z.union([
  heroSectionSchema,
  formSectionSchema,
  textSectionSchema,
]);

export const pageDictionarySchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  meta: pageMetaSchema,
  messages: pageMessagesSchema.optional(),
  seo: z
    .object({
      description: z.string().optional(),
      keywords: z.array(z.string()).optional(),
      image: z.string().optional(),
    })
    .optional(),
  ctas: z.array(ctaSchema).default([]),
  sections: z.array(sectionSchema).default([]),
});

// TypeScript type inference
export type PageDictionary = z.infer<typeof pageDictionarySchema>;
