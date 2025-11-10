import React from "react";
import { ErrorMessage, FieldGroup, Label, TextArea } from "../ui";
import type { FieldConfig } from "./shared";
interface TextAreaFieldProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  config: FieldConfig;
  error?: string;
}

export function TextAreaField({
  name,
  value,
  onChange,
  config,
  error,
}: TextAreaFieldProps) {
  return (
    <FieldGroup>
      <Label htmlFor={name}>{config.label}</Label>
      <TextArea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={config.placeholder}
        hasError={!!error}
      />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </FieldGroup>
  );
}
