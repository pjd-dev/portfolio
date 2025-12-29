type AirtableRecordInput = {
  baseId?: string;
  table?: string;
  fields: Record<string, unknown>;
};

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || "";
const AIRTABLE_API_ROOT = "https://api.airtable.com/v0";

function normalizeAirtableValue(
  value: unknown,
): string | number | boolean | undefined {
  if (value === undefined || value === null) return undefined;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function toAirtableFieldName(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function normalizeAirtableFields(
  fields: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const normalized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(fields)) {
    const normalizedValue = normalizeAirtableValue(value);
    if (normalizedValue === undefined) continue;
    normalized[toAirtableFieldName(key)] = normalizedValue;
  }

  return normalized;
}

export async function sendAirtableRecord(
  input: AirtableRecordInput,
): Promise<{ success: boolean; error?: string }> {
  const baseId = input.baseId ?? AIRTABLE_BASE_ID;
  const table = input.table ?? AIRTABLE_TABLE;

  if (!AIRTABLE_API_KEY || !baseId || !table) {
    console.error("Missing Airtable configuration");
    return {
      success: false,
      error: "Airtable not configured",
    };
  }

  const url = `${AIRTABLE_API_ROOT}/${baseId}/${encodeURIComponent(table)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: normalizeAirtableFields(input.fields),
          },
        ],
        typecast: true,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Airtable request failed", {
        status: response.status,
        body,
      });
      return {
        success: false,
        error: `Airtable request failed: ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Airtable request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown Airtable error",
    };
  }
}
