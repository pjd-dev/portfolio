// lib/validation/shared/baseSectionSchema.ts
import { z } from "zod";

export const baseSectionSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
});
