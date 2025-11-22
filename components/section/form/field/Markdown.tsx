import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { MarkdownFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState } from "react";
import { ErrorMessage, FieldGroup, Label, MarkdownEditor } from "../ui";

import type { FormFieldComponentProps } from "./shared";

export type MarkdownFieldProps = FormFieldComponentProps & {
  config: MarkdownFormField;
};

export function MarkdownField({ value, onChange, config, onError }: MarkdownFieldProps) {
  const { id, name, label, placeholder, width, messages, rows, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;
  const currentValue = value ?? "";
  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
  );
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
  const handleBlur = useCallback(() => {
    runValidation(value ?? "");
  }, [runValidation, value]);

  const handleChange = useCallback(
    (e: string) => {
      const next = value;
      onChange?.(next);
      runValidation(next);
    },
    [onChange, runValidation],
  );

  const hasError = !!localError;

  return (
    <FieldGroup>
      {label && <Label htmlFor={controlName}>{label}</Label>}

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
