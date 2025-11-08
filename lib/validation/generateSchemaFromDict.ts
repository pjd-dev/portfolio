// lib/validation/generateSchemaFromDict.ts
import { z } from "zod";
import type {
  FormSection,
  FormSectionField,
} from "@/lib/validation/section/formDictionarySchema";

/**
 * Generate a Zod schema automatically from a FormSection dictionary.
 * Reads field types, required flags, and optional field messages.
 */
export function generateSchemaFromDict(dict: FormSection) {
  if (!dict?.fields || !Array.isArray(dict.fields)) {
    throw new Error("Invalid FormSection: missing fields array");
  }

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of dict.fields) {
    shape[field.id] = buildFieldSchema(field);
  }

  return z.object(shape);
}

/**
 * Generic helper that keeps the dictionary type around,
 * so we can infer a TS type from a specific dict.
 */
export function createFormSchema<const D extends FormSection>(dict: D) {
  return generateSchemaFromDict(dict);
}

/**
 * Helper type to infer the TS data type from a given FormSection dict.
 *
 * Usage:
 *   import contactDict from "@/app/dictionaries/fr/contact.json";
 *   const schema = createFormSchema(contactDict);
 *   type ContactFormData = InferFormDataFromDict<typeof contactDict>;
 */
export type InferFormDataFromDict<D extends FormSection> = z.infer<
  ReturnType<typeof createFormSchema<D>>
>;

/**
 * Build a single field schema from a FormSectionField definition.
 */
function buildFieldSchema(field: FormSectionField): z.ZodTypeAny {
  // always start from a plain ZodString
  let stringSchema: z.ZodString | z.ZodEmail | z.ZodURL;

  switch (field.type) {
    case "email":
      stringSchema = z.email({ message: "invalid" }).trim();
      break;

    case "url":
      stringSchema = z.url({ message: "invalid" }).trim();
      break;

    case "select":
    case "textarea":
    case "text":
    default:
      stringSchema = z.string().trim();
      break;
  }

  // Required: non-empty string
  if (field.required) {
    stringSchema = stringSchema.min(1, { message: "required" });
  }

  // Optional: infer min length from message text like "au moins 10 caractères"
  if (field.messages?.minLength) {
    const minValue = extractLengthFromMessage(field.messages.minLength);
    if (minValue) {
      stringSchema = stringSchema.min(minValue, { message: "minLength" });
    }
  }

  // Optional: max length from message text like "maximum 200 caractères"
  if (field.messages?.maxLength) {
    const maxValue = extractLengthFromMessage(field.messages.maxLength);
    if (maxValue) {
      stringSchema = stringSchema.max(maxValue, { message: "maxLength" });
    }
  }

  // Only at the end decide if it's optional or not
  if (field.required) {
    return stringSchema;
  }

  return stringSchema.optional();
}

/**
 * Try to infer a numeric min length from message text.
 * Example: "au moins 10 caractères" → 10
 */
function extractLengthFromMessage(message: string): number | null {
  const match = message.match(/\d+/);
  return match ? Number(match[0]) : null;
}
