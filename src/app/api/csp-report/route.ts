export async function POST(request: Request) {
  if (process.env.CSP_REPORT_LOG === 'true') {
    try {
      console.warn('CSP report', await request.json());
    } catch {
      console.warn('CSP report received with unreadable body');
    }
  }

  return new Response(null, { status: 204 });
}
