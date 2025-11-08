import React from "react";
import { styled } from "@/stitches.config";

const FieldGroup = styled("div", {
  marginBottom: "1.5rem",
});

const Label = styled("label", {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: "600",
  marginBottom: "0.5rem",
  color: "#333",
});

const Input = styled("input", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid #e0e0e0",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  
  "&:focus": {
    outline: "none",
    borderColor: "#000",
  },
  
  "&::placeholder": {
    color: "#999",
  },
  
  variants: {
    hasError: {
      true: {
        borderColor: "#ef4444",
      },
    },
  },
});

const Select = styled("select", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid #e0e0e0",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  backgroundColor: "white",
  cursor: "pointer",
  
  "&:focus": {
    outline: "none",
    borderColor: "#000",
  },
  
  variants: {
    hasError: {
      true: {
        borderColor: "#ef4444",
      },
    },
  },
});

const TextArea = styled("textarea", {
  width: "100%",
  padding: "0.75rem 1rem",
  fontSize: "1rem",
  border: "2px solid #e0e0e0",
  borderRadius: "8px",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
  minHeight: "150px",
  resize: "vertical",
  
  "&:focus": {
    outline: "none",
    borderColor: "#000",
  },
  
  "&::placeholder": {
    color: "#999",
  },
  
  variants: {
    hasError: {
      true: {
        borderColor: "#ef4444",
      },
    },
  },
});

const ErrorMessage = styled("p", {
  color: "#ef4444",
  fontSize: "0.875rem",
  marginTop: "0.5rem",
});

interface FieldConfig {
  label: string;
  placeholder: string;
  error?: string;
  options?: Array<{ value: string; label: string }>;
}

interface TextFieldProps {
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  config: FieldConfig;
  error?: string;
}

export function TextField({ name, type = "text", value, onChange, config, error }: TextFieldProps) {
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
      <Select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        hasError={!!error}
      >
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

interface TextAreaFieldProps {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  config: FieldConfig;
  error?: string;
}

export function TextAreaField({ name, value, onChange, config, error }: TextAreaFieldProps) {
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
