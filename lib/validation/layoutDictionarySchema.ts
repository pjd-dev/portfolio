// lib/validation/layoutDictionarySchema.ts
import { z } from "zod";
import { ctaSchema } from "./shared/ctaSchema";

export const FooterSchema = z.object({
  copyright: z.string().optional(),
  links: z
    .object({
      privacyPolicy: ctaSchema.optional(),
      termsOfService: ctaSchema.optional(),
    })
    .optional(),
});

export const HeaderSchema = z.object({
  i18nSwitch: z.boolean().optional(),
  themeSwitch: z.boolean().optional(),
  navLinks: z.array(ctaSchema).optional(),
});

export const layoutDictionarySchema = z.object({
  header: HeaderSchema,
  footer: FooterSchema,
});

// TypeScript type inference
export type LayoutDictionary = z.infer<typeof layoutDictionarySchema>;
export type FooterLayout = z.infer<typeof FooterSchema>;
export type HeaderLayout = z.infer<typeof HeaderSchema>;
