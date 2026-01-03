import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { SelectFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, FieldStatus, Label, Select, SelectRoot } from "../ui";
import type { FormFieldComponentProps } from "./shared";
import { hasFieldValue, isFieldRequired } from "./utils";

export type SelectFieldProps = FormFieldComponentProps & {
  config: SelectFormField;
};

export function SelectField({
  value,
  values,
  onChange,
  config,
  onError,
}: SelectFieldProps) {
  const {
    id,
    name,
    label,
    placeholder = "select something",
    width,
    messages,
    options,
    defaultValue,
  } = config;
  const [localError, setLocalError] = useState<string | null>(null);
  const controlName = name ?? id;
  const isRequired = isFieldRequired(config);
  const currentValue = value == null ? "" : String(value);
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
    // On first mount, if there is no value yet, initialize from explicit defaultValue.
    if ((value === undefined || value === null) && defaultValue !== undefined) {
      const raw = String(defaultValue);
      onChange?.(raw);
      // runValidation(raw as string);
    }
  }, [defaultValue, value, onChange]);

  const handleBlur = useCallback(() => {
    runValidation(currentValue);
  }, [runValidation, currentValue]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
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
      <SelectRoot>
        <Select
          id={id}
          name={controlName}
          value={currentValue}
          onChange={handleChange}
          onBlur={handleBlur}
          hasError={hasError}
          required={isRequired}
          aria-required={isRequired}
          autoComplete="off"
        >
          <option value="">{placeholder ?? ""}</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </SelectRoot>
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
