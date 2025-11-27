import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { CheckboxFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, ToggleInput, ToggleLabel, ToggleWrapper } from "../ui";
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
  }, [defaultValue, value, onChange]);
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

  return (
    <FieldGroup width={width} className="flex flex-col items-center justify-center gap-2">
      {messages?.description && (
        <p className="text-muted-background text-xs">{messages.description}</p>
      )}
      <div className="bg-background/20 inline-flex w-full max-w-xl items-center gap-3 self-center rounded-full border border-white/10 px-4 py-2 backdrop-blur-md">
        <ToggleWrapper>
          <ToggleInput
            id={id}
            name={controlName}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          <ToggleLabel htmlFor={id} />
        </ToggleWrapper>
        {label && (
          <span className="flex-1 text-left text-xs leading-snug text-[var(--background)]">
            {label}
          </span>
        )}
      </div>
      {localError ? (
        <ErrorMessage>{localError}</ErrorMessage>
      ) : (
        messages?.helper && (
          <p className="text-muted-background w-full text-[0.7rem]">{messages.helper}</p>
        )
      )}
    </FieldGroup>
  );
}
