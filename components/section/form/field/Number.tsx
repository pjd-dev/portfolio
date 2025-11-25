import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { NumberFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, Input, Label } from "../ui";
import type { FormFieldComponentProps } from "./shared";

export type NumberFieldProps = FormFieldComponentProps & {
  config: NumberFormField;
};

export function NumberField({ value, onChange, config, onError }: NumberFieldProps) {
  const { id, name, label, placeholder, width, messages, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;

  // Keep value as string in the form state, validation layer handles numeric checks
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
  }, [defaultValue, value, onChange]);

  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
  );

  const handleBlur = useCallback(() => {
    runValidation(String(currentValue));
  }, [runValidation, currentValue]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
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

      <Input
        id={id}
        name={controlName}
        type="number"
        value={currentValue as string}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? ""}
        hasError={hasError}
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

export default NumberField;
