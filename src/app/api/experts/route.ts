import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ExpertApprovalStatus } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') as ExpertApprovalStatus | null;

  if (status === 'APPROVED') {
    const experts = db.getApprovedExperts();
    return NextResponse.json({ success: true, experts });
  }

  if (status === 'PENDING') {
    const experts = db.getPendingExperts();
    return NextResponse.json({ success: true, experts });
  }

  const experts = db.getExpertProfiles();
  return NextResponse.json({ success: true, experts });
}
