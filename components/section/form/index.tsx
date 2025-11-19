import { FormValues } from "@/lib/form/fieldValidation";
import type { FormSection, FormSectionField } from "@/lib/validation/section";
import { useCallback, useMemo, useState } from "react";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { Card, Description, FormWrapper, Inner, Shell, Title } from "./ui";
export function Form({ title, description, fields }: FormSection) {
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
        default:
          acc[key] = "";
      }
    }
    return acc;
  }, [fields]);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
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
  return (
    <FormWrapper>
      <Shell>
        <Card>
          <Inner>
            <Title>{title}</Title>
            <Description>{description}</Description>
            {fields && (
              <form>
                {fields.map((field: FormSectionField) => {
                  const key = (field as any).name ?? field.id;
                  return (
                    <FormFieldRenderer
                      key={field.id}
                      config={field}
                      values={values} // <- new
                      value={values[key]}
                      onChange={handleFieldChange(field)}
                      onError={handleFieldError}
                    />
                  );
                })}
              </form>
            )}
          </Inner>
        </Card>
      </Shell>
    </FormWrapper>
  );
}
