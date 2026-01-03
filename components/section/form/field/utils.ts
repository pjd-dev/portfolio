import type { FormSectionField } from "@/lib/validation/section/formDictionarySchema";

export const isFieldRequired = (config: FormSectionField): boolean =>
  (config.errors ?? []).some((error) => error.rule.type === "required");

export const hasFieldValue = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return !Number.isNaN(value);
  if (typeof value === "string") return value.trim().length > 0;
  return false;
};

export const resolveAutoComplete = (config: FormSectionField): string | undefined => {
  const key = (config.name ?? config.id ?? "").toLowerCase();

  if (config.type === "email" || key.includes("email")) return "email";
  if (key.includes("name")) return "name";
  if (key.includes("company") || key.includes("organization")) return "organization";
  if (config.type === "url" || key.includes("url") || key.includes("link"))
    return "url";
  if (key.includes("phone") || key.includes("tel")) return "tel";
  if (key.includes("message") || key.includes("details") || key.includes("project"))
    return "off";
  return "on";
};
