import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { CheckboxFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import {
  ErrorMessage,
  FieldGroup,
  FieldStatus,
  ToggleInput,
  ToggleLabel,
  ToggleWrapper,
} from "../ui";
import type { FormFieldComponentProps } from "./shared";
import { isFieldRequired } from "./utils";
export type CheckboxFieldProps = FormFieldComponentProps & {
  config: CheckboxFormField;
};

export function CheckboxField({
  value,
  values,
  onChange,
  config,
  onError,
}: CheckboxFieldProps) {
  const { id, name, label, width, messages, defaultValue } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;
  const isRequired = isFieldRequired(config);

  const checked = value === "true" || value === "on" || value === "1" || value === true;
  const showValid = checked && !validateFieldValueFromConfig(config, true, values);

  useEffect(() => {
    const raw = Boolean(defaultValue ?? false);
    if (value === undefined || value === null) {
      onChange?.(raw);
    }
    // runValidation(raw);
  }, [defaultValue, value, onChange]);
  const runValidation = useCallback(
    (raw: boolean) => {
      const errorMessage = validateFieldValueFromConfig(config, raw, values);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError, values],
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
    <FieldGroup span={width} className="flex flex-col items-center justify-center gap-2">
      {messages?.description && (
        <p className="text-muted-background text-xs">{messages.description}</p>
      )}
      <div className="inline-flex w-full max-w-xl items-center gap-3 self-center rounded-full border border-[rgba(var(--background-rgb),0.2)] bg-[rgba(var(--foreground-rgb),0.22)] px-4 py-2 backdrop-blur-md">
        <ToggleWrapper>
          <ToggleInput
            id={id}
            name={controlName}
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            onBlur={handleBlur}
            required={isRequired}
            aria-required={isRequired}
          />
          <ToggleLabel htmlFor={id} />
        </ToggleWrapper>
        {label && (
          <span
            className="flex-1 text-left text-xs leading-snug"
            style={{ color: "var(--background)" }}
          >
            {label}
            {showValid && (
              <FieldStatus className="ml-2" aria-hidden="true">
                ✓
              </FieldStatus>
            )}
            {isRequired && (
              <span style={{ color: "var(--error)" }} aria-hidden="true">
                {" "}
                *
              </span>
            )}
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
