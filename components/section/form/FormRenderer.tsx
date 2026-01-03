import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { FormValues, shouldShowFieldByConfig } from "@/lib/form/formShowWhen";
import type { FormSection, FormSectionField } from "@/lib/validation/section";
import { FormEventHandler, useCallback, useMemo, useRef, useState } from "react";

import { FormFieldRenderer } from "./FormFieldRenderer";
import { Description, Title } from "./ui";
import { FormBody, FormCard, FormFooter, FormHeader, type FormState } from "./ui/form";
import { Scroll, useScroll } from "./ui/scroll";
import { usePage } from "./usePage";
type FormRendererProps = {
  config: FormSection;
};

export function FormRenderer({ config }: FormRendererProps) {
  const { id, meta, title, description, fields, messages } = config;
  const { lang, page } = usePage();
  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<FormState>("idle");
  const scrollHint = messages?.scrollHint ?? null;
  const requiredHint = messages?.requiredHint ?? null;
  const submitLabel = config.submit ?? messages?.submit ?? "Submit";
  const loadingLabel =
    messages?.loading ?? (lang === "fr" ? "Envoi..." : "Sending...");

  const handleFieldChange = useCallback(
    (field: FormSectionField) => (next: FormValues[keyof FormValues] | undefined) => {
      const key = field.name ?? field.id;

      setValues((prev) => {
        const current: FormValues = { ...(prev ?? {}) };

        if (next === undefined) {
          delete current[key];
          return current;
        }

        current[key] = next;
        return current;
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

  const isSubmittable = useMemo(
    () =>
      (fields ?? []).every((field) => {
        if (!shouldShowFieldByConfig(field, values)) return true;
        const key = field.name ?? field.id;
        const rawValue = values[key];
        const msg = validateFieldValueFromConfig(field, rawValue, values);
        return !msg;
      }),
    [fields, values],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    const hasError = (fields ?? []).some((field) => {
      if (!shouldShowFieldByConfig(field, values)) return false;
      const key = field.name ?? field.id;
      const msg = validateFieldValueFromConfig(field, values[key], values);
      setErrors((prev) => ({
        ...prev,
        [key]: msg,
      }));
      return !!msg;
    });

    if (hasError) {
      setStatus("validation");
      return;
    }

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

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { haveScroll, showBar, sizePct, offsetPct, canScroll, reachedEnd } =
    useScroll(scrollRef);

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

  const statusLabel = (() => {
    const labels =
      lang === "fr"
        ? {
            error: "Erreur",
            success: "Succès",
            validation: "Validation",
            submitting: "Info",
            idle: "Info",
          }
        : {
            error: "Error",
            success: "Success",
            validation: "Validation",
            submitting: "Info",
            idle: "Info",
          };
    return labels[status];
  })();

  const showSubmit = isSubmittable || status === "submitting";
  const showRequiredHint = Boolean(requiredHint) && !isSubmittable;

  return (
    <FormCard noValidate onSubmit={handleSubmit}>
      <Scroll.Container>
        <Scroll.Viewport ref={scrollRef}>
          <FormHeader condensed={haveScroll}>
            <Title>{title}</Title>
            <Description>{description}</Description>
          </FormHeader>

          <FormBody>
            {fields.map((field: FormSectionField) => {
              const key = field.name ?? field.id;
              const rawValue = values[key];
              const fieldValue = rawValue === null ? undefined : rawValue;
              return (
                <FormFieldRenderer
                  key={field.id}
                  config={field}
                  values={values}
                  value={fieldValue}
                  onChange={handleFieldChange(field)}
                  onError={handleFieldError}
                />
              );
            })}
          </FormBody>

          <FormFooter.Root>
            <FormFooter.Top>
              {scrollHint && (
                <FormFooter.ScrollHint visible={canScroll && !reachedEnd}>
                  {scrollHint}
                </FormFooter.ScrollHint>
              )}
              <FormFooter.Status
                visible={status !== "idle" && !!statusMessage}
                tone={status}
                label={statusLabel}
              >
                {statusMessage}
              </FormFooter.Status>
            </FormFooter.Top>

            <FormFooter.Base>
              {showRequiredHint && (
                <FormFooter.BaseHint>{requiredHint}</FormFooter.BaseHint>
              )}

              <FormFooter.Submit
                submitting={status === "submitting"}
                disabled={!isSubmittable || status === "submitting"}
                loadingLabel={loadingLabel}
                data-visible={showSubmit}
                aria-hidden={!showSubmit}
                tabIndex={showSubmit ? 0 : -1}
              >
                {submitLabel}
              </FormFooter.Submit>
            </FormFooter.Base>
          </FormFooter.Root>
        </Scroll.Viewport>
        <Scroll.Bar visible={showBar} sizePct={sizePct} offsetPct={offsetPct} />
      </Scroll.Container>
    </FormCard>
  );
}
