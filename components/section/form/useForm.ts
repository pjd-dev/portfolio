import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { FormValues, shouldShowFieldByConfig } from "@/lib/form/formShowWhen";
import type { FormSection, FormSectionField } from "@/lib/validation/section";

import { FormEventHandler, useCallback, useMemo, useState } from "react";
import { type FormState } from "./ui/form";
import { usePage } from "./usePage";

type UseFormProps = {
  fields?: FormSectionField[];
  id?: FormSection["id"];
  meta?: FormSection["meta"];
};

type UseFormReturn = {
  values: FormValues;
  errors: Record<string, string | null>;
  status: FormState;
  handleFieldChange: (field: FormSectionField) => (next: unknown) => void;
  handleSubmit: FormEventHandler<HTMLFormElement>;
  isFormValid: boolean;
  handleFieldError: (fieldId: string, message: string | null) => void;
};
export function useForm({ fields, id, meta }: UseFormProps): UseFormReturn {
  const { lang, page } = usePage();
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<FormState>("idle");

  const handleFieldChange = useCallback(
    (field: FormSectionField) => (next: unknown) => {
      const key = field.name ?? field.id;

      setValues((prev: FormValues) => {
        if (next === undefined) {
          const { [key]: _removed, ...rest } = prev ?? {};
          return rest as FormValues;
        }

        return {
          ...prev,
          [key]: next,
        } as FormValues;
      });
    },
    [],
  );
  const handleFieldError = useCallback((fieldId: string, message: string | null) => {
    setErrors((prev) => ({
      ...prev,
      [fieldId]: message,
    }));
  }, []);

  const isFormValid = useMemo(
    () =>
      (fields ?? []).every((field) => {
        if (!shouldShowFieldByConfig(field, values)) return true;
        const msg = errors[field.id] ?? null;
        return !msg;
      }),
    [fields, values, errors],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    console.log(values);
    // Use hoisted errors; consider only visible fields
    const hasError = (fields ?? []).some((field) => {
      if (!shouldShowFieldByConfig(field, values)) return false;
      const key = field.name ?? field.id;
      const msg = validateFieldValueFromConfig(field, values[key]);
      setErrors({
        [key]: msg,
      });
      return !!msg;
    });

    if (hasError) {
      setStatus("validation");
      return;
    }

    // Fire API call
    const api = meta?.api;
    const endpoint = api?.endpoint ?? "/api/form";
    const method = api?.method ?? "POST";
    const headers = {
      "Content-Type": "application/json",
      ...(api?.headers ?? {}),
    };

    setStatus("submitting");

    try {
      const res = await fetch(endpoint, {
        method,
        headers,
        body: JSON.stringify({
          sectionId: id,
          lang,
          page,
          values,
        }),
      });

      if (!res.ok) {
        throw new Error(`Form submit failed: ${res.status}`);
      }

      setStatus("success");

      if (meta?.successRedirect) {
        window.location.href = meta.successRedirect;
      }
    } catch {
      setStatus("error");
    }
  };
  return {
    values,
    errors,
    status,
    handleFieldChange,
    handleSubmit,
    isFormValid,
    handleFieldError,
  };
}
