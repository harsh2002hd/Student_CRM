import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { statusTag, status, tags } = body;
    
    if (!statusTag) {
      return NextResponse.json({ success: false, error: 'statusTag is required.' }, { status: 400 });
    }

    const updated = db.updateConversationStatusTag(id, statusTag, status, tags);
    return NextResponse.json({ success: true, conversation: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
