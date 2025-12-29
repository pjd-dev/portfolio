import type { FormValues } from "@/lib/form/formShowWhen";
import type {
  FormSectionField,
  PrimitiveValue,
} from "@/lib/validation/section/formDictionarySchema";
export type FormFieldComponentProps = {
  config: FormSectionField;
  value?: PrimitiveValue;
  values?: FormValues;
  onChange?: (value: PrimitiveValue) => void;
  onError?: (fieldId: string, errorMessage: string | null) => void;
};
