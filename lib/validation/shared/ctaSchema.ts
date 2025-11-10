// lib/validation/shared/ctaSchema.ts
import { z } from "zod";

const baseCta = z.object({
  id: z.string().optional(),
  label: z.string(),
  icon: z.string().optional(),
  variant: z.enum(["link", "outline", "solid", "ghost"]).optional(),
});

const internalCtaSchema = baseCta.extend({
  type: z.literal("internal"),
  href: z.string(),
  alt: z.string().optional(),
});

const externalCtaSchema = baseCta.extend({
  type: z.literal("external"),
  href: z.string().url(),
  alt: z.string().optional(),
  target: z.string().default("_blank").optional(),
  rel: z.string().default("noopener noreferrer").optional(),
});

const actionCtaSchema = baseCta.extend({
  type: z.literal("action"),
  action: z.string(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const ctaSchema = z.discriminatedUnion("type", [
  internalCtaSchema,
  externalCtaSchema,
  actionCtaSchema,
]);

// TypeScript type inference
export type Cta = z.infer<typeof ctaSchema>;
export type InternalCta = z.infer<typeof internalCtaSchema>;
export type ExternalCta = z.infer<typeof externalCtaSchema>;
export type ActionCta = z.infer<typeof actionCtaSchema>;
