import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { TextAreaFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, FieldStatus, Label, TextArea } from "../ui";
import type { FormFieldComponentProps } from "./shared";
import { hasFieldValue, isFieldRequired, resolveAutoComplete } from "./utils";

export type TextAreaFieldProps = FormFieldComponentProps & {
  config: TextAreaFormField;
};

export function TextAreaField({
  value,
  values,
  onChange,
  config,
  onError,
}: TextAreaFieldProps) {
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
  useEffect(() => {
    if (value === undefined || value === null) {
      const raw =
        typeof defaultValue === "string"
          ? defaultValue
          : defaultValue == null
            ? ""
            : String(defaultValue);
      onChange?.(raw);
    }
    // runValidation(raw);
  }, [defaultValue, value, onChange]);
  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw, values);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError, values],
  );

  const handleBlur = useCallback(() => {
    runValidation(currentValue);
  }, [runValidation, currentValue]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const next = e.target.value;
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

      <TextArea
        id={id}
        name={controlName}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? ""}
        hasError={hasError}
        rows={rows ?? 4}
        required={isRequired}
        aria-required={isRequired}
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
