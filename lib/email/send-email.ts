import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL ||
  'Lexington Betty Smokehouse <onboarding@resend.dev>';

// TODO: Remove this override once Resend domain is verified for lexingtonbetty.com
const EMAIL_OVERRIDE = 'rdawson@strategicdataproducts.com';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailParams) {
  if (!resend) {
    console.log('--- EMAIL (dev mode, no RESEND_API_KEY) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Reply-To: ${replyTo || 'N/A'}`);
    console.log(`HTML length: ${html.length} chars`);
    console.log(html);
    console.log('--- END EMAIL ---');
    return { success: true, id: 'dev-mode' };
  }

  const recipient = EMAIL_OVERRIDE || to;

  const { data, error } = await resend.emails.send({
    from: DEFAULT_FROM,
    to: recipient,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error(error.message);
  }

  return { success: true, id: data?.id };
}
