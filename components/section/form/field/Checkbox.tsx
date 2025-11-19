import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { CheckboxFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, Input, Label } from "../ui";
import type { FormFieldComponentProps } from "./shared";

export type CheckboxFieldProps = FormFieldComponentProps & {
  config: CheckboxFormField;
};

export function CheckboxField({ value, onChange, config, onError }: CheckboxFieldProps) {
  const { id, name, label, width, messages } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;

  // We store checkbox value as a string ("true" or "") to keep the same value type as other fields.
  const checked = value === "true" || value === "on" || value === "1" || value === true;

  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
  );

  const handleBlur = useCallback(() => {
    const raw = checked ? "true" : "";
    runValidation(raw);
  }, [checked, runValidation]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextChecked = e.target.checked;
      const raw = nextChecked ? "true" : "";
      onChange?.(raw);
      runValidation(raw);
    },
    [onChange, runValidation],
  );

  const hasError = !!localError;

  return (
    <FieldGroup width={width}>
      {messages?.description && (
        <p className="text-muted-foreground text-xs">{messages.description}</p>
      )}

      <Label htmlFor={controlName} className="inline-flex items-center gap-2">
        <Input
          id={id}
          name={controlName}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          onBlur={handleBlur}
          hasError={hasError}
        />
        {label && <span>{label}</span>}
      </Label>

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
