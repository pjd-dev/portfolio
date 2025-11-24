import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { CheckboxFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup } from "../ui";
import type { FormFieldComponentProps } from "./shared";

export type CheckboxFieldProps = FormFieldComponentProps & {
  config: CheckboxFormField;
};

export function CheckboxField({ value, onChange, config, onError }: CheckboxFieldProps) {
  const { id, name, label, width, messages, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;

  const checked = value === "true" || value === "on" || value === "1" || value === true;

  useEffect(() => {
    const raw = Boolean(defaultValue ?? false);
    if (value === undefined || value === null) {
      onChange?.(raw);
    }
    // runValidation(raw);
    return () => {
      onChange?.(undefined);
    };
  }, []);
  const runValidation = useCallback(
    (raw: boolean) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
  );

  const handleBlur = useCallback(() => {
    const raw = checked ? true : false;
    runValidation(raw);
  }, [checked, runValidation]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const nextChecked = e.target.checked;
      const raw = nextChecked ? true : false;
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

      <label
        htmlFor={controlName}
        className="inline-flex cursor-pointer items-start gap-2"
      >
        <input
          id={id}
          name={controlName}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`border-border bg-background focus-visible:ring-offset-background mt-[2px] h-4 w-4 shrink-0 rounded-md border shadow-sm transition-all duration-150 checked:border-transparent checked:bg-gradient-to-br checked:from-[#5b4bff] checked:to-[#37c6ff] focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:outline-none ${hasError ? "border-destructive" : ""}`}
        />
        {label && (
          <span className="text-foreground/80 text-xs leading-snug">{label}</span>
        )}
      </label>

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
