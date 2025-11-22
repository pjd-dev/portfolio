// lib/validation/section/formDictionarySchema.ts
import { z } from "zod";

import { baseSectionSchema } from "../shared/baseSectionSchema";
import { sectionMessagesSchema, sectionMetaSchema } from "../shared/sectionSchema";

// Primitive types allowed in showWhen
export const primitiveValueSchema = z.union([z.string(), z.number(), z.boolean()]);

export const showWhenConditionSchema = z.discriminatedUnion("op", [
  z.object({
    op: z.literal("equals"),
    fieldId: z.string(),
    value: primitiveValueSchema,
  }),
  z.object({
    op: z.literal("notEquals"),
    fieldId: z.string(),
    value: primitiveValueSchema,
  }),
  z.object({
    op: z.literal("in"),
    fieldId: z.string(),
    values: z.array(primitiveValueSchema).min(1),
  }),
  z.object({
    op: z.literal("notIn"),
    fieldId: z.string(),
    values: z.array(primitiveValueSchema).min(1),
  }),
  z.object({
    op: z.literal("isEmpty"),
    fieldId: z.string(),
  }),
  z.object({
    op: z.literal("isNotEmpty"),
    fieldId: z.string(),
  }),
]);

export const showWhenSchema = z.object({
  mode: z.enum(["and", "or"]).default("and"),
  conditions: z.array(showWhenConditionSchema).min(1),
});

/* ---------- field messages schema ---------- */
export const fieldMessagesSchema = z.object({
  description: z.string().optional(),
  helper: z.string().optional(),
  success: z.string().optional(),
  tooltip: z.string().optional(),
});

export type FieldMessages = z.infer<typeof fieldMessagesSchema>;

/* ---------- validation rules (value checks) ---------- */
export const fieldRuleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("required"),
  }),
  z.object({
    type: z.literal("minLength"),
    value: z.number().min(0),
  }),
  z.object({
    type: z.literal("maxLength"),
    value: z.number().min(0),
  }),
  z.object({
    type: z.literal("pattern"),
    regex: z.string().refine((val) => {
      try {
        new RegExp(val);
        return true;
      } catch {
        return false;
      }
    }, "Invalid regex pattern"),
    flags: z.string().optional(), // regex flags
  }),
  z.object({
    type: z.literal("minValue"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("maxValue"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("custom"),
    functionName: z.string(),
  }),
  z.object({
    type: z.literal("email"),
  }),
  z.object({
    type: z.literal("url"),
  }),
]);

export type FieldRule = z.infer<typeof fieldRuleSchema>;
export const fieldErrorSchema = z.object({
  rule: fieldRuleSchema,
  message: z.string(),
});

/* ---------- form field schemas ---------- */
const baseFieldCommon = z.object({
  id: z.string(),
  name: z.string().optional(),
  label: z.string(),
  placeholder: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  width: z.enum(["full", "1/2", "1/3"]).default("full"),
  showWhen: showWhenSchema.optional(),
  errors: z.array(fieldErrorSchema).optional(),
  messages: fieldMessagesSchema.optional(),
});

export const textFieldSchema = baseFieldCommon.extend({
  type: z.literal("text"),
});
export const emailFieldSchema = baseFieldCommon.extend({
  type: z.literal("email"),
});
export const urlFieldSchema = baseFieldCommon.extend({
  type: z.literal("url"),
});

export const numberFieldSchema = baseFieldCommon.extend({
  type: z.literal("number"),
});

export const textAreaFieldSchema = baseFieldCommon.extend({
  type: z.literal("textarea"),
  rows: z.number().default(4),
});
export const markdownFieldSchema = baseFieldCommon.extend({
  type: z.literal("markdown"),
  rows: z.number().optional(),
});

export const selectFieldSchema = baseFieldCommon.extend({
  type: z.literal("select"),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      }),
    )
    .min(1),
});

export const checkboxFieldSchema = baseFieldCommon.extend({
  type: z.literal("checkbox"),
});

export const fieldSchema = z.discriminatedUnion("type", [
  textFieldSchema,
  emailFieldSchema,
  urlFieldSchema,
  numberFieldSchema,
  textAreaFieldSchema,
  selectFieldSchema,
  checkboxFieldSchema,
  markdownFieldSchema,
]);

/* ---------- form section schema ---------- */
export const formSectionSchema = baseSectionSchema.extend({
  kind: z.literal("form"),
  meta: sectionMetaSchema,
  messages: sectionMessagesSchema.optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  fields: z.array(fieldSchema),
  submit: z.string().optional(),
});

/* ---------- TypeScript types infer ---------- */
export type PrimitiveValue = z.infer<typeof primitiveValueSchema>;
export type ShowWhenCondition = z.infer<typeof showWhenConditionSchema>;
export type FieldErrorConfig = z.infer<typeof fieldErrorSchema>;
export type FormSection = z.infer<typeof formSectionSchema>;

export type TextFormField = z.infer<typeof textFieldSchema>;
export type EmailFormField = z.infer<typeof emailFieldSchema>;
export type UrlFormField = z.infer<typeof urlFieldSchema>;
export type NumberFormField = z.infer<typeof numberFieldSchema>;
export type TextAreaFormField = z.infer<typeof textAreaFieldSchema>;

export type MarkdownFormField = z.infer<typeof markdownFieldSchema>;
export type SelectFormField = z.infer<typeof selectFieldSchema>;
export type CheckboxFormField = z.infer<typeof checkboxFieldSchema>;

export type FormSectionField = z.infer<typeof fieldSchema>;
