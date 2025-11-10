// lib/validation/section/heroSchema.ts
import { z } from "zod";
import { baseSectionSchema } from "../shared/baseSectionSchema";
import { ctaSchema } from "../shared/ctaSchema";

export const heroSectionSchema = baseSectionSchema.extend({
  kind: z.literal("hero"),
  title: z.string(), // was "name"
  headline: z.string(), // was "title"
  headlineCta: ctaSchema.optional(),
  plxImg: z
    .object({
      alt: z.string().optional(),
      src: z.string(),
    })
    .optional(),
  ctas: z.array(ctaSchema).default([]),
});

// TypeScript type inference
export type HeroSection = z.infer<typeof heroSectionSchema>;
