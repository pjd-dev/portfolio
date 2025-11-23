import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { FormValues, shouldShowFieldByConfig } from "@/lib/form/formShowWhen";
import type { FormSection, FormSectionField } from "@/lib/validation/section";
import { usePathname } from "next/navigation";
import {
  FormEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { Description, FormWrapper, Title } from "./ui";
import { FormBody, FormCard, FormFooter, FormHeader, SubmitButton } from "./ui/form";
import { ScrollContainer, ScrollThumb, ScrollTrack, ScrollViewport } from "./ui/scroll";

export function Form({ id, meta, title, description, fields, messages }: FormSection) {
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const langFromPath = segments[0] ?? "";
  const pageFromPath = segments.length > 1 ? `/${segments.slice(1).join("/")}` : "/";
  console.log(" lang ", langFromPath);
  console.log(" page ", pageFromPath);

  const [values, setValues] = useState<FormValues>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error" | "validation"
  >("idle");
  const [condensed, setCondensed] = useState(false);
  const [thumbHeight, setThumbHeight] = useState(100);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [showScrollBar, setShowScrollBar] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const updateScrollMetrics = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;

    // no scrolling needed
    if (scrollHeight <= clientHeight + 1) {
      setThumbHeight(100);
      setThumbOffset(0);
      setShowScrollBar(false);
      return;
    }

    const visibleRatio = clientHeight / scrollHeight;
    const heightPercent = Math.max(visibleRatio * 100, 15); // min 15% thumb

    const scrollable = scrollHeight - clientHeight;
    const maxOffset = 100 - heightPercent;
    const offsetPercent = scrollable <= 0 ? 0 : (scrollTop / scrollable) * maxOffset;

    setThumbHeight(heightPercent);
    setThumbOffset(offsetPercent);
    setShowScrollBar(true);
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    updateScrollMetrics();
    // you can also keep condensed header logic here:
    const el = e.currentTarget;
    setCondensed(el.scrollTop > 8);
  };

  useEffect(() => {
    updateScrollMetrics();
    const el = scrollRef.current;
    if (!el) return;

    const onResize = () => updateScrollMetrics();

    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [updateScrollMetrics]);
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
      <FormCard noValidate onSubmit={handleSubmit}>
        <FormHeader condensed={condensed}>
          <Title>{title}</Title>
          <Description>{description}</Description>
        </FormHeader>
        <ScrollContainer>
          <ScrollViewport ref={scrollRef} onScroll={handleScroll}>
            <FormBody>
              {fields.map((field: FormSectionField) => {
                const key = field.name ?? field.id;
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
            </FormBody>
          </ScrollViewport>
          {showScrollBar && (
            <ScrollTrack>
              <ScrollThumb
                style={{
                  height: `${thumbHeight}%`,
                  transform: `translateY(${thumbOffset}%)`,
                }}
              />
            </ScrollTrack>
          )}
        </ScrollContainer>
        <FormFooter>
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
          <SubmitButton type="submit" disabled={status === "submitting" || !isFormValid}>
            {messages?.submit}
          </SubmitButton>
        </FormFooter>
      </FormCard>
    </FormWrapper>
  );
}
