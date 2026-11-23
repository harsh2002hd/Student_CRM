import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  const expertId = searchParams.get('expertId');

  if (studentId) {
    const orders = db.getOrdersByStudentId(studentId);
    return NextResponse.json({ success: true, orders });
  }

  if (expertId) {
    const orders = db.getOrdersByExpertId(expertId);
    return NextResponse.json({ success: true, orders });
  }

  const orders = db.getOrders();
  return NextResponse.json({ success: true, orders });
}
