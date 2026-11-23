import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const forExperts = searchParams.get('forExperts');

  if (studentId) {
    const queries = db.getQueriesByStudentId(studentId);
    return NextResponse.json({ success: true, queries });
  }

  if (forExperts === 'true') {
    const queries = db.getOpenQueriesForApprovedExperts();
    return NextResponse.json({ success: true, queries });
  }

  const queries = db.getQueries();
  return NextResponse.json({ success: true, queries });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, subject, title, description, deadline, budget, urgency, attachments } = body;

    if (!studentId || !subject || !title || !description || !deadline) {
      return NextResponse.json(
        { success: false, error: 'Missing required query fields' },
        { status: 400 }
      );
    }

    const query = db.createQuery({
      studentId,
      subject,
      title,
      description,
      deadline,
      budget: Number(budget) || 1200,
      urgency: urgency || 'MEDIUM',
      attachments: attachments || [],
    });

    return NextResponse.json({ success: true, query });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
