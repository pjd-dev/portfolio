import sanitizeHtml from "sanitize-html";

export const toSafeString = (value: unknown): string =>
  value == null ? "" : String(value);

export function sanitize(text: string): string {
  return sanitizeHtml(toSafeString(text), {
    allowedTags: [],
    allowedAttributes: {},
  });
}
