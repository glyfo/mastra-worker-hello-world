
import { Hono } from 'hono';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import  EmailTemplate  from './emails/EmailTemplate';

type Bindings = {
  RESEND_API_KEY: string;
  DEFAULT_FROM?: string; // e.g. "Speaking Roses <hello@yourdomain.com>"
};

interface SendBody {
  to: string | string[];
  subject: string;
  firstName: string;
}

const app = new Hono<{ Bindings: Bindings }>();

app.get('/health', (c) => c.text('ok'));

app.post('/send', async (c:any) => {
  const apiKey: string | undefined = c.env.RESEND_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'Missing RESEND_API_KEY' }, 500);
  }

  let body: SendBody;
  try {
    body = (await c.req.json()) as SendBody;
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { to, subject, firstName } = body;
  if (!to || !subject || !firstName) {
    return c.json({ error: 'to, subject, and firstName are required' }, 400);
  }

  const toList: string[] = Array.isArray(to) ? to : [to];
  if (toList.length === 0) {
    return c.json({ error: 'Recipient list is empty' }, 400);
  }

  const resend = new Resend(apiKey);
  const from: string = c.env.DEFAULT_FROM ?? 'Acme <onboarding@resend.dev>';

  try {
  const response = await resend.emails.send({
    from,
    to: toList,
    subject: String(subject).trim(),
    react: await EmailTemplate({ firstName: String(firstName).trim() }),
  });

    if (response.error) {
      return c.json({ error: response.error }, 400);
    }

    return c.json({ id: response.data?.id ?? null });
  } catch (err) {
    console.error('Error sending email:', err);
    return c.json({ error: 'Failed to send email' }, 500);
  }
});

export default app;
