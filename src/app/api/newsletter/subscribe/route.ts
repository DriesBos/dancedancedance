import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSiteUrl } from '@/lib/site-url';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_API_SERVER = process.env.MAILCHIMP_API_SERVER;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const isValidEmail = (email: string) =>
  email.length > 0 && email.length <= 254 && EMAIL_PATTERN.test(email);

const SITE_ORIGIN = new URL(getSiteUrl()).origin;
const MAX_REQUEST_BYTES = 2048;

interface NewsletterPayload {
  email?: unknown;
  company?: unknown;
}

const toNewsletterPayload = (value: unknown): NewsletterPayload =>
  value && typeof value === 'object' ? (value as NewsletterPayload) : {};

const isBotSubmission = (payload: NewsletterPayload) =>
  typeof payload.company === 'string' && payload.company.trim().length > 0;

const getOrigin = (value: string | null) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const getRequestOrigin = (request: Request) => {
  const host =
    request.headers.get('x-forwarded-host') || request.headers.get('host');
  if (!host) return SITE_ORIGIN;

  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (host.startsWith('localhost') || host.startsWith('127.0.0.1')
      ? 'http'
      : 'https');

  return `${protocol}://${host}`;
};

const isSameOriginRequest = (request: Request) => {
  const requestOrigin = getRequestOrigin(request);
  const origin = getOrigin(request.headers.get('origin'));
  if (origin) return origin === requestOrigin;

  const referer = getOrigin(request.headers.get('referer'));
  return referer === requestOrigin;
};

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: 'Request is too large' }, { status: 413 });
    }

    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const payload = toNewsletterPayload(await request.json());
    const email = normalizeEmail(payload.email);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Enter a valid email address' },
        { status: 400 }
      );
    }

    if (isBotSubmission(payload)) {
      return NextResponse.json(
        { data: 'Successfully subscribed!' },
        { status: 200 }
      );
    }

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_AUDIENCE_ID || !MAILCHIMP_API_SERVER) {
      return NextResponse.json(
        { error: 'Mailchimp configuration is missing' },
        { status: 500 }
      );
    }

    // Subscribe the user to the list
    const subscribeResponse = await fetch(
      `https://${MAILCHIMP_API_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
        }),
      }
    );

    const subscribeData = await subscribeResponse.json();

    // Handle already subscribed case
    if (
      subscribeData.status === 400 &&
      subscribeData.title === 'Member Exists'
    ) {
      // User is already subscribed, we can still add the tag
    } else if (!subscribeResponse.ok) {
      return NextResponse.json(
        { error: subscribeData.detail || 'Failed to subscribe' },
        { status: subscribeResponse.status }
      );
    }

    // Add "DriesBos" tag to the subscriber
    // The subscriber hash is the MD5 hash of the lowercase email address
    const subscriberHash = crypto
      .createHash('md5')
      .update(email)
      .digest('hex');

    const tagResponse = await fetch(
      `https://${MAILCHIMP_API_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_AUDIENCE_ID}/members/${subscriberHash}/tags`,
      {
        method: 'POST',
        headers: {
          Authorization: `apikey ${MAILCHIMP_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: [{ name: 'DriesBos', status: 'active' }],
        }),
      }
    );

    // Tag endpoint returns 204 No Content on success
    if (!tagResponse.ok) {
      console.error('Failed to add tag:', await tagResponse.text());
      // Don't fail the whole request if tagging fails
    }

    return NextResponse.json(
      { data: 'Successfully subscribed!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
