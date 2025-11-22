import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { TextAreaFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, Label, TextArea } from "../ui";
import type { FormFieldComponentProps } from "./shared";

export type TextAreaFieldProps = FormFieldComponentProps & {
  config: TextAreaFormField;
};

export function TextAreaField({ value, onChange, config, onError }: TextAreaFieldProps) {
  const { id, name, label, placeholder, width, messages, rows, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;
  const currentValue = value ?? "";
  useEffect(() => {
    const raw = defaultValue ?? "";
    if (value === undefined || value === null) {
      onChange?.(raw);
    }
    // runValidation(raw);
    return () => {
      onChange?.(undefined);
    };
  }, []);
  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
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
    <FieldGroup width={width}>
      {label && <Label htmlFor={controlName}>{label}</Label>}

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
