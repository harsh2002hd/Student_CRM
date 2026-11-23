import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { studentId, expertId } = await req.json();

    if (!studentId || !expertId) {
      return NextResponse.json(
        { success: false, error: 'Student ID and Expert ID are required' },
        { status: 400 }
      );
    }

    const conversation = db.getOrCreateConversation(studentId, expertId);
    return NextResponse.json({ success: true, conversation });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
