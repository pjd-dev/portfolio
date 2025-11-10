// lib/validation/pageDictionarySchema.ts
import { z } from "zod";
import {
  heroSectionSchema,
  formSectionSchema,
  textSectionSchema,
  legalSectionSchema,
} from "@/lib/validation/section";
import { pageMetaSchema, pageMessagesSchema } from "@/lib/validation/shared";
import { pageSeoSchema } from "@/lib/validation/shared/seoSchema";

export const sectionSchema = z.union([
  heroSectionSchema,
  formSectionSchema,
  textSectionSchema,
]);

export const basePageDictionarySchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  meta: pageMetaSchema,
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
