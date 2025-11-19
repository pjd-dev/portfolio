import type { FormSectionField } from "@/lib/validation/section/formDictionarySchema";
export type FormFieldComponentProps = {
  config: FormSectionField;
  value?: PrimitiveValue;
  onChange?: (value: PrimitiveValue) => void;
  onError?: (fieldId: string, errorMessage: string | null) => void;
};
