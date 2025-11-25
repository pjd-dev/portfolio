import type { FormSection, FormSectionField } from "@/lib/validation/section";

import { useRef } from "react";
import { FormFieldRenderer } from "./FormFieldRenderer";
import { Description, Title } from "./ui";
import { FormBody, FormCard, FormFooter, FormHeader } from "./ui/form";
import { Scroll, useScroll } from "./ui/scroll";
import { useForm } from "./useForm";
type FormRendererProps = {
  config: FormSection;
};

export function FormRenderer({ config }: FormRendererProps) {
  const { id, meta, title, description, fields, messages } = config;
  const {
    values,
    status,
    isFormValid,
    handleFieldChange,
    handleSubmit,
    handleFieldError,
  } = useForm({
    fields,
    id,
    meta,
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { haveScroll, showBar, sizePct, offsetPct, canScroll } = useScroll(scrollRef);
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

  return (
    <FormCard noValidate onSubmit={handleSubmit}>
      <FormHeader condensed={haveScroll}>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </FormHeader>
      <Scroll.Container>
        <Scroll.Viewport ref={scrollRef}>
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
        </Scroll.Viewport>
        <Scroll.Bar visible={showBar} sizePct={sizePct} offsetPct={offsetPct} />
      </Scroll.Container>
      <FormFooter.Root>
        <FormFooter.Top>
          <FormFooter.ScrollHint visible={canScroll}>
            Faites défiler pour voir tous les champs du formulaire.
          </FormFooter.ScrollHint>
          <FormFooter.Status visible={status !== "idle" && !!statusMessage} tone={status}>
            {statusMessage}
          </FormFooter.Status>
        </FormFooter.Top>
        <FormFooter.Base>
          <FormFooter.BaseHint>
            Tous les champs marqués d’un * sont obligatoires.
          </FormFooter.BaseHint>

          <FormFooter.Submit
            submitting={status === "submitting"}
            disabled={!isFormValid || status === "submitting"}
          >
            Envoyer le message
          </FormFooter.Submit>
        </FormFooter.Base>
      </FormFooter.Root>
    </FormCard>
  );
}
