import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Verification credentials could not be authenticated.';
    const updated = db.updateExpertApprovalStatus(params.id, 'REJECTED', reason);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Expert profile not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: 'Expert application rejected.',
      profile: updated,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
