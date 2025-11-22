import { sanitize } from "./sanitizer";
type BaseEmailTemplateOptions = {
  title?: string; // logical title + heading
  preheader?: string; // inbox preview
  bodyHtml: string; // inner content (form section HTML)
  brandName?: string;
  logoUrl?: string;
};

export function renderBaseEmailTemplate({
  title = "Portfolio Notification",
  preheader = "",
  bodyHtml,
  brandName = "darrybook",
  logoUrl = "https://darrybook.fr/logotype/DB_Favicon_64.png",
}: BaseEmailTemplateOptions): string {
  const safeTitle = sanitize(title);
  const safePreheader = sanitize(preheader);
  const safeBrand = sanitize(brandName);
  const safeLogoUrl = logoUrl ? sanitize(logoUrl) : null;

  const logoHtml = safeLogoUrl
    ? `<img src="${safeLogoUrl}" width="64" height="64" alt="${safeBrand} logo" style="display:block; margin:0 0 12px; border-radius:12px; background-color: white" />`
    : "";
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>${safeTitle}</title>
    <style type="text/css">
      body, table, td, a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table, td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        height: 100% !important;
      }
      /* Mobile tweaks */
      @media screen and (max-width: 640px) {
        .email-container {
          width: 100% !important;
        }
        .stack-column,
        .stack-column td {
          display: block !important;
          width: 100% !important;
        }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background-color:#0b0b0f;">
    <!-- Preheader (hidden) -->
    <div style="display:none; font-size:1px; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
      ${safePreheader}
    </div>

    <!-- Full-width background table -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#0b0b0f">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <!-- Inner container -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width:640px; background-color:#111118; border-radius:12px; border:1px solid #2a2a3a;">
            <tr>
              <td style="padding:24px 20px; font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#f5f5f7;">
                
                <!-- Logo -->
                ${logoHtml}
                
                <!-- Heading -->
                <h1 style="margin:0 0 12px; font-size:20px; font-weight:600; line-height:1.3;">
                  ${safeTitle}
                </h1>

                <!-- Body -->
                <div style="font-size:14px; line-height:1.5;">
                  ${bodyHtml}
                </div>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:640px; margin-top:12px;">
            <tr>
              <td align="center" style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size:12px; color:#9a9ab5; padding:8px 0;">
                ${safeBrand} • ${new Date().getFullYear()}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
