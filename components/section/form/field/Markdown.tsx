import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { MarkdownFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState } from "react";
import { ErrorMessage, FieldGroup, FieldStatus, Label, MarkdownEditor } from "../ui";

import type { FormFieldComponentProps } from "./shared";
import { hasFieldValue, isFieldRequired, resolveAutoComplete } from "./utils";

export type MarkdownFieldProps = FormFieldComponentProps & {
  config: MarkdownFormField;
};

export function MarkdownField({
  value,
  values,
  onChange,
  config,
  onError,
}: MarkdownFieldProps) {
  const { id, name, label, placeholder, width, messages, rows, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;
  const isRequired = isFieldRequired(config);
  const autoComplete = resolveAutoComplete(config);
  const currentValue =
    typeof value === "string" ? value : value == null ? "" : String(value);
  const showValid =
    hasFieldValue(currentValue) &&
    !validateFieldValueFromConfig(config, currentValue, values);
  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw, values);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError, values],
  );
  useEffect(() => {
    if (value === undefined || value === null) {
      const raw =
        typeof defaultValue === "string"
          ? defaultValue
          : defaultValue == null
            ? ""
            : String(defaultValue);
      onChange?.(raw);
      // If you want initial validation, uncomment the next line:
      // runValidation(raw);
    }
  }, [defaultValue, value, onChange]);

  const handleBlur = useCallback(() => {
    runValidation(currentValue);
  }, [runValidation, currentValue]);

  const handleChange = useCallback(
    (next: string) => {
      onChange?.(next);
      runValidation(next);
    },
    [onChange, runValidation],
  );

  const hasError = !!localError;

  return (
    <FieldGroup span={width}>
      {label && (
        <Label htmlFor={controlName} required={isRequired}>
          <span>{label}</span>
          {showValid && <FieldStatus aria-hidden="true">✓</FieldStatus>}
        </Label>
      )}

      {messages?.description && (
        <p className="text-muted-foreground text-xs">{messages.description}</p>
      )}

      <MarkdownEditor
        id={id}
        name={controlName}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? ""}
        hasError={hasError}
        width={width}
        rows={rows ?? 10}
        required={isRequired}
        autoComplete={autoComplete}
      />

      {localError ? (
        <ErrorMessage>{localError}</ErrorMessage>
      ) : (
        messages?.helper && (
          <p className="text-muted-foreground text-[0.7rem]">{messages.helper}</p>
        )
      )}
    </FieldGroup>
  );
}
export default MarkdownField;
