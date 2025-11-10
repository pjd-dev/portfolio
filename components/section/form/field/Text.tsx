import React from "react";
import { ErrorMessage, FieldGroup, Input, Label } from "../ui";
import type { FieldConfig } from "./shared";
export interface TextFieldProps {
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  config: FieldConfig;
  error?: string;
}

export function TextField({
  name,
  type = "text",
  value,
  onChange,
  config,
  error,
}: TextFieldProps) {
  return (
    <FieldGroup>
      <Label htmlFor={name}>{config.label}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={config.placeholder}
        hasError={!!error}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FieldGroup>
  );
}
