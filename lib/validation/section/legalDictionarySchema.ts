// lib/validation/section/textDictionarySchema.ts
import { z } from "zod";
import { baseSectionSchema } from "@/lib/validation/shared/baseSectionSchema";

export const legalSectionSchema = baseSectionSchema.extend({
  type: z.literal("text"),
  title: z.string().optional(),
  content: z.string().optional(), // can be long markdown or plain text
  lastUpdated: z.string().optional(), //"Dernière mise à jour : novembre 2025",
  note: z.string().optional(), // "Ce document sera mis à jour dès qu’un formulaire ou un outil de suivi sera ajouté."
});

// TypeScript type inference
export type LegalSection = z.infer<typeof legalSectionSchema>;
