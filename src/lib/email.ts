import { logger } from './logger';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API if configured, otherwise logs to console.
 * Set RESEND_API_KEY and EMAIL_FROM in env vars for production.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'SE AI <noreply@seai.app>';

  if (!apiKey) {
    // Dev fallback: log the email
    logger.info('email.dev', { to, subject, note: 'RESEND_API_KEY not set, logging email' });
    console.log(`\n========== EMAIL ==========`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text || html}`);
    console.log(`===========================\n`);
    return true;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html, text }),
    });

    if (!res.ok) {
      const err = await res.text();
      logger.error('email.send_failed', { to, subject, status: res.status, error: err });
      return false;
    }

    logger.info('email.sent', { to, subject });
    return true;
  } catch (error) {
    logger.error('email.error', { to, subject, error: error instanceof Error ? error.message : 'Unknown' });
    return false;
  }
}

export function buildVerificationEmail(verifyUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Verify your SE AI account',
    text: `Welcome to SE AI! Please verify your email by visiting: ${verifyUrl}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #e4e4e7;">Welcome to SE AI</h2>
        <p style="color: #a1a1aa;">Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #71717a; font-size: 12px;">If you didn&apos;t create an account, you can ignore this email.</p>
      </div>
    `,
  };
}

export function buildPasswordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset your SE AI password',
    text: `You requested a password reset. Visit: ${resetUrl}\nThis link expires in 1 hour.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #e4e4e7;">Reset your password</h2>
        <p style="color: #a1a1aa;">You requested a password reset for your SE AI account.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #71717a; font-size: 12px;">This link expires in 1 hour. If you didn&apos;t request this, ignore this email.</p>
      </div>
    `,
  };
}
