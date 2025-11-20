// lib/validation/generateSchemaFromDict.ts
import type {
  FormSection,
  FormSectionField,
} from "@/lib/validation/section/formDictionarySchema";
import { z } from "zod";

/**
 * Generate a Zod schema automatically from a FormSection dictionary.
 * Reads field types + error rules and produces a value schema keyed by
 * `field.name` when present, otherwise `field.id`.
 */
export function generateSchemaFromDict(dict: FormSection) {
  if (!dict?.fields || !Array.isArray(dict.fields)) {
    throw new Error("Invalid FormSection: missing fields array");
  }

  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of dict.fields) {
    const key = field.name ?? field.id;
    shape[key] = buildFieldSchema(field);
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
 * Uses `errors` rules (FieldErrorConfig) to compose constraints.
 *
 * - String-like fields → z.string()
 * - Number field      → z.number()
 * - Checkbox field    → z.boolean()
 *
 * If no `required` rule is present, the field is treated as optional.
 */
function buildFieldSchema(field: FormSectionField): z.ZodTypeAny {
  const isStringField =
    field.type === "text" ||
    field.type === "email" ||
    field.type === "url" ||
    field.type === "textarea" ||
    field.type === "markdown" ||
    field.type === "select";

  const isNumberField = field.type === "number";
  const isBooleanField = field.type === "checkbox";

  let schema: z.ZodTypeAny;

  if (isStringField) {
    schema = z.string().trim();
  } else if (isNumberField) {
    schema = z.number();
  } else if (isBooleanField) {
    schema = z.boolean();
  } else {
    // fallback, should not happen given the discriminated union
    schema = z.any();
  }

  const errors = field.errors ?? [];
  let hasRequired = false;

  for (const errorCfg of errors) {
    const rule = errorCfg.rule;
    const message = errorCfg.message;

    switch (rule.type) {
      case "required": {
        hasRequired = true;
        break;
      }

      case "minLength": {
        if (isStringField) {
          schema = (schema as z.ZodString).min(rule.value, {
            message,
          });
        }
        break;
      }

      case "maxLength": {
        if (isStringField) {
          schema = (schema as z.ZodString).max(rule.value, {
            message,
          });
        }
        break;
      }

      case "pattern": {
        if (isStringField) {
          const re = new RegExp(rule.regex, rule.flags);
          schema = (schema as z.ZodString).regex(re, {
            message,
          });
        }
        break;
      }

      case "email": {
        if (isStringField) {
          schema = (schema as z.ZodString).email({
            message,
          });
        }
        break;
      }

      case "url": {
        if (isStringField) {
          schema = (schema as z.ZodString).url({
            message,
          });
        }
        break;
      }

      case "minValue": {
        if (isNumberField) {
          schema = (schema as z.ZodNumber).min(rule.value, {
            message,
          });
        }
        break;
      }

      case "maxValue": {
        if (isNumberField) {
          schema = (schema as z.ZodNumber).max(rule.value, {
            message,
          });
        }
        break;
      }

      case "custom": {
        // Custom rules are not enforced here since we only have a functionName,
        // not an actual implementation. You can attach custom refinements
        // manually on top of the generated schema if needed.
        break;
      }

      default:
        // Exhaustiveness guard: in case new rule types are added in the future.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rule as any;
        break;
    }
  }

  if (!hasRequired) {
    schema = schema.optional();
  }

  return schema;
}
