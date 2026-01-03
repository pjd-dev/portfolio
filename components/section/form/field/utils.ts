import type { FormSectionField } from "@/lib/validation/section/formDictionarySchema";

export const isFieldRequired = (config: FormSectionField): boolean =>
  (config.errors ?? []).some((error) => error.rule.type === "required");
