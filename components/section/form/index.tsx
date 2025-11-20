import { FormValues, shouldShowFieldByConfig } from "@/lib/form/formShowWhen";
import type { FormSection, FormSectionField } from "@/lib/validation/section";
import { usePathname } from "next/navigation";
import { FormEventHandler, useCallback, useMemo, useState } from "react";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { Card, Description, FormWrapper, Inner, Shell, Title } from "./ui";
export function Form({ id, meta, title, description, fields, messages }: FormSection) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const langFromPath = segments[0] ?? "";
  const pageFromPath = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "/";

  const initialValues: FormValues = useMemo(() => {
    const acc: FormValues = {};
    for (const field of fields ?? []) {
      const key = (field as any).name ?? field.id;
      switch (field.type) {
        case "checkbox":
          acc[key] = false;
          break;
        case "number":
          acc[key] = "";
          break;
        case "select":
          acc[key] = field.options?.[0]?.value ?? "";
          break;
        default:
          acc[key] = "";
      }
    }
    return acc;
  }, [fields]);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error" | "validation"
  >("idle");

  const statusMessage =
    status === "validation"
      ? (messages?.validation ?? "Please fix the highlighted fields.")
      : status === "submitting"
        ? (messages?.loading ?? "Sending your message...")
        : status === "success"
          ? (messages?.success ?? "Your message has been sent.")
          : status === "error"
            ? (messages?.error ?? "Something went wrong. Please try again.")
            : null;

  const handleFieldChange = useCallback(
    (field: FormSectionField) => (next: unknown) => {
      const key = (field as any).name ?? field.id;
      setValues((prev) => ({
        ...prev,
        [key]: next,
      }));
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

    // Use hoisted errors; consider only visible fields
    const hasError = (fields ?? []).some((field) => {
      if (!shouldShowFieldByConfig(field, values)) return false;
      const msg = errors[field.id] ?? null;
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
          lang: langFromPath,
          page: pageFromPath,
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

  return (
    <FormWrapper>
      <Shell>
        <Card>
          <Inner>
            {title && <Title>{title}</Title>}
            {description && <Description>{description}</Description>}

            {fields && (
              <form noValidate onSubmit={handleSubmit}>
                {fields.map((field: FormSectionField) => {
                  const key = (field as any).name ?? field.id;
                  return (
                    <FormFieldRenderer
                      key={field.id}
                      config={field}
                      values={values}
                      value={values[key]}
                      onChange={handleFieldChange(field)}
                      onError={handleFieldError}
                    />
                  );
                })}
                <button type="submit" disabled={status === "submitting" || !isFormValid}>
                  {messages?.submit}
                </button>
                {statusMessage && (
                  <p
                    role="status"
                    className={`mt-2 text-xs ${
                      status === "error"
                        ? "text-red-500"
                        : status === "success"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {statusMessage}
                  </p>
                )}
              </form>
            )}
          </Inner>
        </Card>
      </Shell>
    </FormWrapper>
  );
}
