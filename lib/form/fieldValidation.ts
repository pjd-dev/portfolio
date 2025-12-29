import { runCustomValidator } from "@/lib/form/customValidators";
import type {
  FieldRule,
  FormSectionField,
  PrimitiveValue,
} from "@/lib/validation/section/formDictionarySchema";

export type FormValues = Record<string, PrimitiveValue | null | undefined>;

function checkRule(rule: FieldRule, rawValue: unknown): boolean {
  const str =
    typeof rawValue === "string" ? rawValue : rawValue == null ? "" : String(rawValue);
  const trimmed = str.trim();

  switch (rule.type) {
    case "required":
      if (typeof rawValue === "boolean") {
        return rawValue === true;
      }
      return trimmed.length > 0;

    case "minLength":
      return trimmed.length >= rule.value;

    case "maxLength":
      return trimmed.length <= rule.value;

    case "pattern": {
      const re = new RegExp(rule.regex, rule.flags);
      return re.test(trimmed);
    }

    case "minValue": {
      if (
        !(
          typeof rawValue === "string" ||
          typeof rawValue === "number" ||
          rawValue === null
        )
      ) {
        return false;
      }
      // empty → let "required" handle it
      if (trimmed.length === 0) return true;
      const num = Number(trimmed);
      if (Number.isNaN(num)) return false;
      return num >= rule.value;
    }

    case "maxValue": {
      if (
        !(
          typeof rawValue === "string" ||
          typeof rawValue === "number" ||
          rawValue === null
        )
      ) {
        return false;
      }
      if (trimmed.length === 0) return true;
      const num = Number(trimmed);
      if (Number.isNaN(num)) return false;
      return num <= rule.value;
    }

    case "custom":
      return true;

    case "email":
      return /\S+@\S+\.\S+/.test(trimmed);

    case "url":
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }

    default:
      return true;
  }
}

/**
 * Returns first failing error message, or null if valid.
 */
export function validateFieldValueFromConfig(
  config: FormSectionField,
  rawValue: unknown,
  values?: FormValues,
): string | null {
  const rules = config.errors;
  if (!rules || rules.length === 0) return null;

  const key = config.name ?? config.id;
  const valuesForValidation: FormValues = values ? { ...values } : {};
  if (rawValue !== undefined) {
    valuesForValidation[key] = rawValue as PrimitiveValue | null | undefined;
  }

  for (const errorCfg of rules) {
    const ok = checkRule(errorCfg.rule, rawValue);
    if (errorCfg.rule.type === "custom") {
      const result = runCustomValidator(errorCfg.rule.functionName, {
        value: rawValue,
        values: valuesForValidation,
        field: config,
        rule: errorCfg.rule,
      });
      if (!result.ok) {
        return result.message ?? errorCfg.message;
      }
      continue;
    }
    if (!ok) return errorCfg.message;
  }

  return null;
}
