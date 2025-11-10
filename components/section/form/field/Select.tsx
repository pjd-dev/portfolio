import React from "react";
import { ErrorMessage, FieldGroup, Label, Select } from "../ui";
import type { FieldConfig } from "./shared";
interface SelectFieldProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  config: FieldConfig;
  error?: string;
}
export function SelectField({ name, value, onChange, config, error }: SelectFieldProps) {
  return (
    <FieldGroup>
      <Label htmlFor={name}>{config.label}</Label>
      <Select id={name} name={name} value={value} onChange={onChange} hasError={!!error}>
        <option value="">{config.placeholder}</option>
        {config.options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FieldGroup>
  );
}
