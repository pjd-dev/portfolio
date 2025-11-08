import nodemailer from "nodemailer";
// import type { ContactFormData } from "./schemas/contact";
import sanitizeHtml from "sanitize-html";

const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const SMTP_CONTACT_FROM = process.env.SMTP_CONTACT_FROM || SMTP_USER;
const SMTP_CONTACT_TO = process.env.SMTP_CONTACT_TO || SMTP_USER;

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Sanitize HTML to prevent XSS
function sanitize(text: string): string {
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}

// Format contact data into email body
function formatEmailBody(data: unknown): string {
  const { name, email, subject, message } = data;

  let body = `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${sanitize(name)}</p>
    <p><strong>Email:</strong> ${sanitize(email)}</p>
    <p><strong>Subject:</strong> ${sanitize(subject)}</p>
  `;

  // Add conditional fields based on subject
  if (subject === "freelance" && "company" in data) {
    body += `
      <p><strong>Company:</strong> ${sanitize(data.company)}</p>
      <p><strong>Budget:</strong> ${sanitize(data.budget)}</p>
      <p><strong>Deadline:</strong> ${sanitize(data.deadline)}</p>
    `;
  }

  if (subject === "collab" && "projectLink" in data) {
    body += `
      <p><strong>Project Link:</strong> ${sanitize(data.projectLink)}</p>
      <p><strong>Goal:</strong> ${sanitize(data.goal)}</p>
    `;
  }

  body += `
    <p><strong>Message:</strong></p>
    <p>${sanitize(message).replace(/\n/g, "<br>")}</p>
  `;

  return body;
}

// Send contact email
export async function sendContactEmail(
  data: ContactFormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate environment variables
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.error("Missing SMTP configuration");
      return {
        success: false,
        error: "Email service not configured",
      };
    }

    const emailBody = formatEmailBody(data);
    const subjectMap = {
      recruitment: "Job Opportunity",
      freelance: "Freelance Project",
      collab: "Collaboration",
      other: "General Inquiry",
    };

    // Send email
    await transporter.sendMail({
      from: SMTP_CONTACT_FROM,
      to: SMTP_CONTACT_TO,
      replyTo: data.email,
      subject: `Portfolio Contact: ${subjectMap[data.subject]}`,
      html: emailBody,
      text: emailBody.replace(/<[^>]*>/g, ""), // Plain text version
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
