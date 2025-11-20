import {
  CheckboxField,
  MarkdownField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from "./field";

/**
 * Runtime props shared by all form field components.
 */

import { shouldShowFieldByConfig, type FormValues } from "@/lib/form/formShowWhen";
import type { FormFieldComponentProps } from "./field";
type FormRendererProps = FormFieldComponentProps & {
  values: FormValues;
};
export function FormFieldRenderer({
  config,
  value,
  values,
  onChange,
  onError,
}: FormRendererProps) {
  if (!shouldShowFieldByConfig(config, values ?? {})) {
    return null;
  }

  switch (config.type) {
    case "textarea":
      return (
        <TextAreaField
          config={config}
          value={value}
          onChange={onChange}
          onError={onError}
        />
      );

    case "markdown":
      return (
        <MarkdownField
          config={config}
          value={value}
          onChange={onChange}
          onError={onError}
        />
      );

    case "select":
      return (
        <SelectField
          config={config}
          value={value}
          onChange={onChange}
          onError={onError}
        />
      );

    case "checkbox":
      return (
        <CheckboxField
          config={config}
          value={value}
          onChange={onChange}
          onError={onError}
        />
      );

    case "number":
      return (
        <NumberField
          config={config}
          value={value}
          onChange={onChange}
          onError={onError}
        />
      );

    case "text":
    case "email":
    case "url":
    default:
      return (
        <TextField config={config} value={value} onChange={onChange} onError={onError} />
      );
  }
}
