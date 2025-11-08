// lib/validation/shared/pageSchema.ts
import { z } from "zod";

/* ---------------- Page-level meta  ---------------- */
export const pageMetaSchema = z.object({
  version: z.number().default(1),
  locale: z.string().default("fr"),
  theme: z.string().optional(),
});

/* ---------------- Page-level messages ---------------- */
export const pageMessagesSchema = z
  .object({
    success: z.string().optional(),
    error: z.string().optional(),
    validation: z.string().optional(),
    loading: z.string().optional(),
  })
  .default({});

// TypeScript type inference
export type PageMeta = z.infer<typeof pageMetaSchema>;
export type PageMessage = z.infer<typeof pageMessagesSchema>;
