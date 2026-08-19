import nodemailer from 'nodemailer';

export interface ContactFormData {
  fullName: string;
  company?: string;
  email: string;
  phone?: string;
  projectType: string;
  message: string;
}

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export async function sendContactEmail(
  data: ContactFormData,
  companyEmail: string
): Promise<SendEmailResult> {
  try {
    // Validate SMTP config
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
    const secure = process.env.SMTP_SECURE !== 'false';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const fromEmail = process.env.SMTP_FROM || user;
    const fromName = process.env.SMTP_FROM_NAME || 'Smart Konstruksi';

    if (!host || !user || !pass) {
      return {
        success: false,
        error: 'SMTP configuration missing. Please contact administrator.',
      };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    // Build email content
    const subject = `New project inquiry — ${data.fullName}${
      data.company ? ` (${data.company})` : ''
    }`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #004f35; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 16px; }
    .label { font-weight: 600; color: #004f35; font-size: 14px; margin-bottom: 4px; }
    .value { color: #111827; font-size: 15px; }
    .message-box { background: white; padding: 16px; border-left: 3px solid #004f35; margin-top: 8px; }
    .footer { text-align: center; padding: 16px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Project Inquiry</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name</div>
        <div class="value">${escapeHtml(data.fullName)}</div>
      </div>
      ${
        data.company
          ? `
      <div class="field">
        <div class="label">Company</div>
        <div class="value">${escapeHtml(data.company)}</div>
      </div>
      `
          : ''
      }
      <div class="field">
        <div class="label">Email</div>
        <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #004f35;">${escapeHtml(data.email)}</a></div>
      </div>
      ${
        data.phone
          ? `
      <div class="field">
        <div class="label">Phone</div>
        <div class="value">${escapeHtml(data.phone)}</div>
      </div>
      `
          : ''
      }
      <div class="field">
        <div class="label">Project Type</div>
        <div class="value">${escapeHtml(data.projectType)}</div>
      </div>
      <div class="field">
        <div class="label">Message</div>
        <div class="message-box">${escapeHtml(data.message).replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    <div class="footer">
      Sent from Smart Konstruksi contact form
    </div>
  </div>
</body>
</html>
    `.trim();

    const textBody = `
Name: ${data.fullName}
${data.company ? `Company: ${data.company}\n` : ''}Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}Project Type: ${data.projectType}

Message:
${data.message}
    `.trim();

    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: companyEmail,
      replyTo: data.email,
      subject,
      text: textBody,
      html: htmlBody,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: 'Failed to send email. Please try again later.',
    };
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
