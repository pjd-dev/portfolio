import nodemailer from "nodemailer";

// Generic low-level mail sender used by all helpers
export type SendEmailOptions = {
  to?: string | string[];
  from?: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
};

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_CONTACT_FROM = process.env.SMTP_CONTACT_FROM || SMTP_USER;
const SMTP_CONTACT_TO = process.env.SMTP_CONTACT_TO || SMTP_USER;

// Create reusable transporter
export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Verify SMTP connection (for testing)
export async function verifySmtpConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error("SMTP verification failed:", error);
    return false;
  }
}

export async function sendEmail(
  options: SendEmailOptions,
): Promise<{ success: boolean; error?: string }> {
  const { to, from, replyTo, subject, html, text } = options;

  try {
    // Env guard
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error("Missing SMTP configuration");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    await transporter.sendMail({
      from: from ?? SMTP_CONTACT_FROM,
      to: to ?? SMTP_CONTACT_TO,
      replyTo,
      subject,
      html,
      // Fallback plain text
      text: text ?? html.replace(/<[^>]*>/g, ""),
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
