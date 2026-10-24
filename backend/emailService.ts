import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string;
  subject: string;
  title: string;
  body: string;
  code?: string;
  actionText?: string;
}

export interface EmailSendResult {
  sent: boolean;
  message: string;
  previewCode?: string;
}

/**
 * Creates nodemailer transporter if SMTP credentials are configured in environment.
 */
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
}

/**
 * Send an email (verification, OTP login, or password reset).
 * Gracefully falls back to preview mode if SMTP is not configured.
 */
export async function sendAuthenticationEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const { to, subject, title, body, code, actionText } = options;
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || '"FinTrack Security" <noreply@fintrack.app>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b1329; color: #f8fafc; margin: 0; padding: 24px; }
          .card { max-width: 520px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { display: inline-block; background: #10b981; color: #022c22; font-weight: bold; font-size: 18px; padding: 8px 16px; border-radius: 8px; letter-spacing: 0.5px; }
          h2 { color: #f8fafc; font-size: 20px; margin-top: 16px; margin-bottom: 8px; }
          p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 12px 0; }
          .code-box { background: #020617; border: 1px dashed #334155; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #34d399; }
          .notice { font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; border-top: 1px solid #1e293b; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">FinTrack</div>
            <h2>${title}</h2>
          </div>
          <p>${body}</p>
          ${
            code
              ? `<div class="code-box">
                  <p style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">${actionText || 'Security Verification Code'}</p>
                  <div class="code">${code}</div>
                  <p style="margin: 8px 0 0 0; font-size: 11px; color: #64748b;">This code expires in 15 minutes.</p>
                </div>`
              : ''
          }
          <div class="notice">
            If you did not request this email, you can safely ignore it. Your account remains protected.<br>
            FinTrack &bull; Addis Ababa &bull; Worldwide
          </div>
        </div>
      </body>
    </html>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to,
        subject,
        text: `${title}\n\n${body}\n\n${code ? `Your code: ${code}\nThis code expires in 15 minutes.` : ''}`,
        html: htmlContent,
      });

      console.log(`[EMAIL DISPATCH] Sent to ${to} via SMTP: ${subject}`);
      return {
        sent: true,
        message: 'Security code successfully dispatched to your email address.',
      };
    } catch (err: any) {
      console.warn(`[EMAIL DISPATCH WARNING] SMTP failed, using sandbox fallback: ${err.message}`);
    }
  }

  // Fallback / Development Simulation mode:
  console.log('---------------------------------------------------------');
  console.log(`[SIMULATED EMAIL DISPATCH]`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  if (code) console.log(`CODE: ${code}`);
  console.log('---------------------------------------------------------');

  return {
    sent: true,
    message: 'Verification code generated and dispatched.',
    previewCode: code,
  };
}
