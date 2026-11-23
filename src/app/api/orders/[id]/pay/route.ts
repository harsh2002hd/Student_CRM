import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { paymentMethod } = await req.json();
    const result = db.processPayment(params.id, paymentMethod || 'Mock Razorpay / UPI');

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Order not found or payment could not be processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and held in secure platform escrow.',
      order: result.order,
      invoice: result.invoice,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
