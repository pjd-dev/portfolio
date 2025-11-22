import { renderJsonValuesEmail } from "./renderer";
import { sendEmail } from "./smtp";

export async function sendJsonValuesEmail(
  subject: string,
  preheader = "New JSON data received",
  data: Record<string, unknown>,
): Promise<{ success: boolean; error?: string }> {
  const html = renderJsonValuesEmail(data, {
    title: subject,
    preheader,
    brandName: "darrybook",
  });

  return await sendEmail({
    subject,
    html,
  });
}
