import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('Received webhook payload:', payload);

    return NextResponse.json({ status: 'ok', message: 'Webhook received' });
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
