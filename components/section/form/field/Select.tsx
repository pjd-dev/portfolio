import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { SelectFormField } from "@/lib/validation/section/formDictionarySchema";
import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { ErrorMessage, FieldGroup, Label, Select, SelectRoot } from "../ui";
import type { FormFieldComponentProps } from "./shared";

export type SelectFieldProps = FormFieldComponentProps & {
  config: SelectFormField;
};

export function SelectField({ value, onChange, config, onError }: SelectFieldProps) {
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

  const runValidation = useCallback(
    (raw: string) => {
      const errorMessage = validateFieldValueFromConfig(config, raw);
      setLocalError(errorMessage ?? null);
      onError?.(id, errorMessage ?? null);
    },
    [config, id, onError],
  );

  useEffect(() => {
    // On first mount, if there is no value yet, initialize from defaultValue or first option.
    if (
      (value === undefined || value === null) &&
      (defaultValue !== undefined || options.length > 0)
    ) {
      const raw = defaultValue ?? options[0]?.value ?? "";
      onChange?.(raw);
      // runValidation(raw as string);
    }
  }, [defaultValue, value, options, onChange]);

  const handleBlur = useCallback(() => {
    runValidation(value ?? "");
  }, [runValidation, value]);

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
    <FieldGroup width={width}>
      {label && <Label htmlFor={controlName}>{label}</Label>}

      {messages?.description && (
        <p className="text-muted-foreground text-xs">{messages.description}</p>
      )}
      <SelectRoot>
        <Select
          id={id}
          name={controlName}
          value={value ?? ""}
          onChange={handleChange}
          onBlur={handleBlur}
          hasError={hasError}
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
