import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');

    let reports;
    if (parentId) {
      const stmt = db.prepare('SELECT * FROM DistributionReports WHERE parent_node_id = ? ORDER BY created_at DESC');
      reports = stmt.all(parentId);
    } else {
      const stmt = db.prepare('SELECT * FROM DistributionReports ORDER BY created_at DESC LIMIT 50');
      reports = stmt.all();
    }

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, parent_node_id, report_data } = body;

    const stmt = db.prepare('INSERT INTO DistributionReports (id, parent_node_id, report_data) VALUES (?, ?, ?)');
    stmt.run(id, parent_node_id || 'global', JSON.stringify(report_data));

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error saving report:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
