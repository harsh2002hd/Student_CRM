import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { studentId, rating, comment } = await req.json();

    const order = db.getOrderById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const review = db.createReview({
      orderId: order.id,
      studentId: studentId || order.studentId,
      expertId: order.expertId,
      rating: Number(rating),
      comment: comment || 'Great work!',
    });

    // Mark order as completed if not already
    if (order.status !== 'COMPLETED') {
      db.updateOrderStatus(order.id, 'COMPLETED');
    }

    return NextResponse.json({ success: true, review });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
