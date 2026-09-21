import { NextResponse } from 'next/server';
import { store } from '@/lib/store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    store.currentCrisis = {
      crisis_type: body.crisis_type,
      severity_percent: body.severity_percent,
      affected_resources: body.affected_resources,
      timestamp: new Date().toISOString(),
    };
    
    return NextResponse.json({ status: 'crisis_paused', crisis: store.currentCrisis });
  } catch {
    return NextResponse.json({ error: 'Invalid crisis data' }, { status: 400 });
  }
}
