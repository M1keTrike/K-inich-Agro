import { NextResponse } from 'next/server';
import { Vote } from '@/types';

export async function POST(request: Request) {
  try {
    const body: Vote = await request.json();
    
    // Aquí se actualizaría el estado global con el escenario seleccionado.
    // Como es MVP mock:
    return NextResponse.json({
      status: 'normal',
      message: 'Vote registered and scenario applied.',
      vote: {
        scenario_id: body.scenario_id,
        applied_at: new Date().toISOString()
      }
    });
  } catch {
    return NextResponse.json({ error: 'Invalid vote data' }, { status: 400 });
  }
}
