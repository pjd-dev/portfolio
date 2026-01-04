// lib/validation/section/heroFormDictionarySchema.ts
import { z } from "zod";
import { baseSectionSchema } from "../shared/baseSectionSchema";
import { ctaSchema } from "../shared/ctaSchema";
import { formSectionSchema } from "./formDictionarySchema";

export const formContentSchema = formSectionSchema.omit({ kind: true });

export const heroFormSectionSchema = baseSectionSchema.extend({
  kind: z.literal("heroForm"),
  title: z.string(),
  headline: z.string(),
  headlineCta: ctaSchema.optional(),
  plxImg: z
    .object({
      alt: z.string().optional(),
      src: z.string(),
    })
    .optional(),
  form: formContentSchema,
});

export type HeroFormSection = z.infer<typeof heroFormSectionSchema>;
export type HeroFormContent = z.infer<typeof formContentSchema>;
