// lib/validation/section/heroSchema.ts
import { z } from "zod";
import { ctaSchema } from "../shared/ctaSchema";
import { baseSectionSchema } from "../shared/baseSectionSchema";

export const heroSectionSchema = baseSectionSchema.extend({
  type: z.literal("hero"),
  title: z.string(), // was "name"
  headline: z.string(), // was "title"
  headlineCta: ctaSchema.optional(),
  img: z
    .object({
      background: z
        .object({
          alt: z.string().optional(),
          src: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  ctas: z.array(ctaSchema).default([]),
});

// TypeScript type inference
export type HeroSection = z.infer<typeof heroSectionSchema>;
