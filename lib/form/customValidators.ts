import type { FormValues } from "@/lib/form/formShowWhen";
import type {
  FieldRule,
  FormSectionField,
} from "@/lib/validation/section/formDictionarySchema";

export type CustomRule = Extract<FieldRule, { type: "custom" }>;

export type CustomValidatorContext = {
  value: unknown;
  values: FormValues;
  field: FormSectionField;
  rule: CustomRule;
};

export type CustomValidator = (context: CustomValidatorContext) => boolean | string;

const customValidators: Record<string, CustomValidator> = {};

export function registerCustomValidator(
  name: string,
  validator: CustomValidator,
): void {
  if (!name) return;
  customValidators[name] = validator;
}

export function clearCustomValidators(): void {
  for (const key of Object.keys(customValidators)) {
    delete customValidators[key];
  }
}

export function runCustomValidator(
  name: string,
  context: CustomValidatorContext,
): { ok: boolean; message?: string } {
  const validator = customValidators[name];
  if (!validator) {
    console.warn("Custom validator not found", { name });
    return { ok: false };
  }

  const result = validator(context);
  if (result === true) return { ok: true };
  if (result === false) return { ok: false };

  return { ok: false, message: result };
}
