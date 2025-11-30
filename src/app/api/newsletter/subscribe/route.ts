import { NextResponse } from 'next/server';
import crypto from 'crypto';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY;
const MAILCHIMP_AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;
const MAILCHIMP_API_SERVER = process.env.MAILCHIMP_API_SERVER;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
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
      .update(email.toLowerCase())
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
    if (!tagResponse.ok && tagResponse.status !== 204) {
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
