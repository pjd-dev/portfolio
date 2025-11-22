import { sanitize } from "./sanitizer";
import { renderBaseEmailTemplate } from "./template";
type JsonRecord = Record<string, unknown>;

function formatJsonValueForEmail(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "number" || typeof value === "string") {
    return String(value);
  }

  // Objects / arrays → JSON string in a <pre>
  try {
    const json = JSON.stringify(value, null, 2);
    return `<pre style="margin:0; font-family:monospace; font-size:12px; white-space:pre-wrap;">${sanitize(
      json,
    )}</pre>`;
  } catch {
    return sanitize(String(value));
  }
}

function renderJsonAsTableRows(data: JsonRecord): string {
  const rows: string[] = [];

  for (const [key, rawValue] of Object.entries(data)) {
    if (rawValue === undefined || rawValue === null) continue;

    const label = key
      .replace(/_/g, " ")
      .replace(/\s+/g, " ")
      .replace(/^\w/, (c) => c.toUpperCase());

    const formatted = formatJsonValueForEmail(rawValue);

    // If formatted is empty string, skip
    if (!formatted) continue;

    const safeLabel = sanitize(label);

    rows.push(`
      <tr>
        <td valign="top" style="font-weight:600; padding:2px 8px 2px 0;">
          ${safeLabel}:
        </td>
        <td valign="top" style="padding:2px 0;">
          ${formatted}
        </td>
      </tr>
    `);
  }

  if (rows.length === 0) return "";

  return `
    <table cellpadding="4" cellspacing="0" border="0" style="border-collapse:collapse; width:100%;">
      ${rows.join("")}
    </table>
  `;
}

type RenderJsonEmailOptions = {
  title?: string;
  preheader?: string;
  brandName?: string;
};

/**
 * Transform a JSON values object into a full HTML email using the base template.
 *
 * Example:
 *   const html = renderJsonValuesEmail(values, {
 *     title: "Raw form payload",
 *     preheader: "New submission",
 *   });
 */
export function renderJsonValuesEmail(
  data: JsonRecord,
  options: RenderJsonEmailOptions = {},
): string {
  const tableHtml = renderJsonAsTableRows(data);
  const preheader = options.preheader ?? "New JSON payload received";
  const bodyHtml = `
    <p style="margin:0 0 12px; font-size:14px;">
      ${sanitize(preheader)}
    </p>
    ${tableHtml}
  `;

  return renderBaseEmailTemplate({
    title: options.title ?? "JSON Submission",
    preheader: preheader,
    bodyHtml,
    brandName: options.brandName ?? "darrybook",
  });
}
