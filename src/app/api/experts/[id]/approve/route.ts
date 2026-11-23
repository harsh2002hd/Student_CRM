import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = db.updateExpertApprovalStatus(params.id, 'APPROVED');
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Expert profile not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: 'Expert successfully approved! Access to queries and chat unlocked.',
      profile: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
