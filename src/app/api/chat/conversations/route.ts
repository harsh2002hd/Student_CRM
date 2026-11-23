import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'usr_stu_1';
  const role = (searchParams.get('role') as UserRole) || 'STUDENT';

  const conversations = db.getConversations(userId, role);
  return NextResponse.json({ success: true, conversations });
}
