// lib/validation/pageDictionarySchema.ts
import {
  formSectionSchema,
  heroSectionSchema,
  legalSectionSchema,
  textSectionSchema,
} from "@/lib/validation/section";
import { pageMessagesSchema, pageMetaSchema } from "@/lib/validation/shared";
import { pageSeoSchema } from "@/lib/validation/shared/seoSchema";
import { z } from "zod";

export const sectionSchema = z.union([
  heroSectionSchema,
  formSectionSchema,
  textSectionSchema,
]);

export const basePageDictionarySchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  meta: pageMetaSchema.optional(),
  messages: pageMessagesSchema.optional(),
  seo: pageSeoSchema.optional(),
});

export const pageDictionarySchema = basePageDictionarySchema.extend({
  sections: z.array(sectionSchema).default([]),
});

export const pageLegalDictionarySchema = basePageDictionarySchema.extend({
  content: legalSectionSchema,
});

// TypeScript type inference
export type PageDictionary = z.infer<
  typeof pageDictionarySchema | typeof pageLegalDictionarySchema
>;
export type Sections = z.infer<typeof sectionSchema>;
