import type {
  FormSectionField,
  PrimitiveValue,
  ShowWhenCondition,
} from "@/lib/validation/section/formDictionarySchema";

export type FormValues = Record<string, PrimitiveValue | null | undefined>;

function isEmptyValue(v: PrimitiveValue | null | undefined): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  // numbers/booleans are never "empty" except null/undefined
  return false;
}

function evalShowWhenCondition(cond: ShowWhenCondition, allValues: FormValues): boolean {
  if (!cond || !cond.fieldId || !cond.op) return false;
  if (!allValues) return false;

  const v = allValues[cond?.fieldId] ?? null;

  switch (cond.op) {
    case "equals":
      // fail closed if no value provided in config
      if (cond.value === undefined) return false;
      return v === cond.value;

    case "notEquals":
      if (cond.value === undefined) return false;
      return v !== cond.value;

    case "in":
      if (!Array.isArray(cond.values) || cond.values.length === 0) return false;
      return cond.values.some((candidate) => candidate === v);

    case "notIn":
      if (!Array.isArray(cond.values) || cond.values.length === 0) return false;
      return !cond.values.some((candidate) => candidate === v);

    case "isEmpty":
      return isEmptyValue(v as PrimitiveValue | null | undefined);

    case "isNotEmpty":
      return !isEmptyValue(v as PrimitiveValue | null | undefined);

    default:
      return false;
  }
}

export function shouldShowFieldByConfig(
  field: FormSectionField,
  allValues: FormValues,
): boolean {
  const cfg = field.showWhen;
  if (!cfg) return true;

  const { mode, conditions } = cfg;
  if (!conditions || conditions.length === 0) return true;

  const results = conditions.map((c) => evalShowWhenCondition(c, allValues));

  if (mode === "or") {
    return results.some(Boolean);
  }

  // default "and"
  return results.every(Boolean);
}
