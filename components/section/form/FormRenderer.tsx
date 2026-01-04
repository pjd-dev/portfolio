import { validateFieldValueFromConfig } from "@/lib/form/fieldValidation";
import { FormValues, shouldShowFieldByConfig } from "@/lib/form/formShowWhen";
import type { FormSection, FormSectionField } from "@/lib/validation/section";
import { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { FormFieldRenderer } from "./FormFieldRenderer";
import { Description, Title } from "./ui";
import {
  FormAlert,
  FormAlertItem,
  FormAlertList,
  FormAlertTitle,
  FormBody,
  FormCard,
  FormFooter,
  FormHeader,
  FormProgress,
  FormProgressDot,
  FormProgressDots,
  FormProgressLabel,
  StepButton,
  StepControls,
  type FormState,
} from "./ui/form";
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
  const [currentStep, setCurrentStep] = useState(0);
  const [draftVisible, setDraftVisible] = useState(false);
  const draftHydratedRef = useRef(false);

  const visibleFields = useMemo(
    () => (fields ?? []).filter((field) => shouldShowFieldByConfig(field, values)),
    [fields, values],
  );
  const enableScroll = (fields?.length ?? 0) > 4;

  const stepCount = useMemo(() => {
    const total = fields?.length ?? 0;
    if (total >= 9) return 3;
    if (total >= 5) return 2;
    return 1;
  }, [fields?.length]);

  const steps = useMemo(() => {
    if (stepCount <= 1) return [visibleFields];
    const size = Math.max(1, Math.ceil(visibleFields.length / stepCount));
    const nextSteps = Array.from({ length: stepCount }, (_, index) =>
      visibleFields.slice(index * size, (index + 1) * size),
    ).filter((step) => step.length > 0);
    return nextSteps.length > 0 ? nextSteps : [visibleFields];
  }, [visibleFields, stepCount]);

  const currentStepFields = steps[currentStep] ?? visibleFields;
  const isLastStep = currentStep >= steps.length - 1;
  const showSteps = steps.length > 1;

  useEffect(() => {
    if (currentStep > steps.length - 1) {
      setCurrentStep(Math.max(0, steps.length - 1));
    }
  }, [currentStep, steps.length]);

  const draftKey = useMemo(
    () => `form-draft:${id}:${lang}:${page}`,
    [id, lang, page],
  );

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values?: FormValues } | FormValues;
      const restored =
        parsed && typeof parsed === "object" && "values" in parsed
          ? parsed.values
          : parsed;
      if (restored && typeof restored === "object" && !Array.isArray(restored)) {
        // Ensure restored is a plain FormValues object, not { values: ... }
        const restoredValues =
          restored && typeof restored === "object" && "values" in restored
            ? (restored as { values?: FormValues }).values ?? {}
            : restored;
        setValues((prev) => ({ ...(prev ?? {}), ...(restoredValues as FormValues) }));
        setDraftVisible(true);
      }
    } catch {
      // ignore malformed drafts
    } finally {
      draftHydratedRef.current = true;
    }
  }, [draftKey]);

  useEffect(() => {
    if (!draftHydratedRef.current) return;
    if (typeof window === "undefined") return;
    const cleaned = Object.entries(values ?? {}).reduce<FormValues>((acc, [key, value]) => {
      if (value === undefined || value === null) return acc;
      if (typeof value === "string" && value.trim().length === 0) return acc;
      if (value === false) return acc;
      acc[key] = value;
      return acc;
    }, {});
    if (Object.keys(cleaned).length === 0) {
      window.localStorage.removeItem(draftKey);
      return;
    }
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({ values: cleaned, savedAt: Date.now() }),
    );
  }, [draftKey, values]);

  useEffect(() => {
    if (!draftVisible) return;
    const timer = window.setTimeout(() => setDraftVisible(false), 4000);
    return () => window.clearTimeout(timer);
  }, [draftVisible]);

  const isSubmittable = useMemo(
    () =>
      visibleFields.every((field) => {
        const key = field.name ?? field.id;
        const rawValue = values[key];
        const msg = validateFieldValueFromConfig(field, rawValue, values);
        return !msg;
      }),
    [visibleFields, values],
  );

  const validateFields = useCallback(
    (targetFields: FormSectionField[]) => {
      let hasError = false;
      const nextErrors: Record<string, string | null> = {};
      targetFields.forEach((field) => {
        if (!shouldShowFieldByConfig(field, values)) return;
        const key = field.name ?? field.id;
        const msg = validateFieldValueFromConfig(field, values[key], values);
        nextErrors[key] = msg;
        if (msg) hasError = true;
      });
      if (Object.keys(nextErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...nextErrors }));
      }
      return !hasError;
    },
    [values],
  );

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();

    if (!validateFields(fields ?? [])) {
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
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftKey);
      }

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

  useEffect(() => {
    if (!showSteps) return;
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentStep, showSteps]);

  const handleStepChange = useCallback((nextStep: number) => {
    setCurrentStep(nextStep);
    setStatus("idle");
  }, []);

  const handleStepNext = useCallback(() => {
    if (!validateFields(currentStepFields)) {
      setStatus("validation");
      return;
    }
    handleStepChange(Math.min(currentStep + 1, steps.length - 1));
  }, [currentStep, currentStepFields, handleStepChange, steps.length, validateFields]);

  const handleStepBack = useCallback(() => {
    handleStepChange(Math.max(currentStep - 1, 0));
  }, [currentStep, handleStepChange]);

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
            info: "Info",
          }
        : {
            error: "Error",
            success: "Success",
            validation: "Validation",
            submitting: "Info",
            idle: "Info",
            info: "Info",
          };
    return labels[status];
  })();

  const errorSummary = useMemo(() => {
    return visibleFields
      .map((field) => {
        const key = field.name ?? field.id;
        const message = errors[key];
        if (!message) return null;
        return { id: field.id, label: field.label, message };
      })
      .filter(
        (item): item is { id: string; label: string; message: string } =>
          item !== null,
      );
  }, [errors, visibleFields]);

  const handleSummaryClick = useCallback((fieldId: string) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(fieldId);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (typeof (target as HTMLElement).focus === "function") {
      (target as HTMLElement).focus();
    }
  }, []);

  const showErrorSummary = status === "validation" && errorSummary.length > 0;
  const errorSummaryTitle =
    lang === "fr" ? "Champs a corriger" : "Fix these fields";

  useEffect(() => {
    if (status !== "validation") return;
    if (errorSummary.length > 0) return;
    setStatus("idle");
  }, [errorSummary.length, status]);

  const readyMessage = lang === "fr" ? "Pret a envoyer." : "Ready to send.";
  const readyLabel = lang === "fr" ? "Pret" : "Ready";
  const draftMessage =
    lang === "fr" ? "Brouillon restaure." : "Draft restored.";
  const draftLabel = lang === "fr" ? "Reprise" : "Resume";

  const showReady = isSubmittable && status === "idle" && isLastStep;
  const showDraft = draftVisible && status === "idle" && !showReady;

  const footerStatus =
    status !== "idle" && statusMessage
      ? { tone: status, label: statusLabel, message: statusMessage }
      : showDraft
        ? { tone: "info", label: draftLabel, message: draftMessage }
        : showReady
          ? { tone: "success", label: readyLabel, message: readyMessage }
          : null;

  const showSubmit = (isLastStep && isSubmittable) || status === "submitting";
  const showRequiredHint = Boolean(requiredHint) && !isSubmittable;
  const canGoBack = showSteps && currentStep > 0;
  const canGoNext = showSteps && currentStep < steps.length - 1;
  const stepNavDisabled = status === "submitting" || status === "success";

  return (
    <FormCard noValidate onSubmit={handleSubmit} scrollable={enableScroll}>
      <Scroll.Container>
        <Scroll.Viewport ref={scrollRef} scrollable={enableScroll}>
          <FormHeader condensed={haveScroll}>
            <Title>{title}</Title>
            <Description>{description}</Description>
            {showSteps && (
              <FormProgress>
                <FormProgressLabel>
                  {lang === "fr"
                    ? `Etape ${currentStep + 1} sur ${steps.length}`
                    : `Step ${currentStep + 1} of ${steps.length}`}
                </FormProgressLabel>
                <FormProgressDots>
                  {steps.map((_, index) => (
                    <FormProgressDot key={`${id}-step-${index}`} active={index <= currentStep} />
                  ))}
                </FormProgressDots>
              </FormProgress>
            )}
          </FormHeader>

          {showErrorSummary && (
            <FormAlert role="alert">
              <FormAlertTitle>{errorSummaryTitle}</FormAlertTitle>
              <FormAlertList>
                {errorSummary.map((item) => (
                  <FormAlertItem
                    key={item.id}
                    type="button"
                    onClick={() => handleSummaryClick(item.id)}
                  >
                    <span>{item.label}</span>
                    <span>{item.message}</span>
                  </FormAlertItem>
                ))}
              </FormAlertList>
            </FormAlert>
          )}

          <FormBody>
            {currentStepFields.map((field: FormSectionField) => {
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
              {scrollHint && enableScroll && (
                <FormFooter.ScrollHint visible={canScroll && !reachedEnd}>
                  {scrollHint}
                </FormFooter.ScrollHint>
              )}
              <FormFooter.Status
                visible={!!footerStatus}
                tone={(footerStatus?.tone as FormState) ?? "idle"}
                label={footerStatus?.label}
              >
                {footerStatus?.message ?? ""}
              </FormFooter.Status>
            </FormFooter.Top>

            <FormFooter.Base>
              {showRequiredHint && (
                <FormFooter.BaseHint>{requiredHint}</FormFooter.BaseHint>
              )}

              <FormFooter.Actions>
                {showSteps && (
                  <StepControls>
                    <StepButton
                      type="button"
                      onClick={handleStepBack}
                      disabled={!canGoBack || stepNavDisabled}
                    >
                      {lang === "fr" ? "Retour" : "Back"}
                    </StepButton>
                    {canGoNext && (
                      <StepButton
                        type="button"
                        tone="primary"
                        onClick={handleStepNext}
                        disabled={stepNavDisabled}
                      >
                        {lang === "fr" ? "Suivant" : "Next"}
                      </StepButton>
                    )}
                  </StepControls>
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
              </FormFooter.Actions>
            </FormFooter.Base>
          </FormFooter.Root>
        </Scroll.Viewport>
        <Scroll.Bar
          visible={enableScroll && showBar}
          sizePct={sizePct}
          offsetPct={offsetPct}
        />
      </Scroll.Container>
    </FormCard>
  );
}
