import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { file, deliveryNote } = await req.json();

    if (!file || !file.name || !file.url) {
      return NextResponse.json(
        { success: false, error: 'File deliverable is required' },
        { status: 400 }
      );
    }

    const order = db.deliverOrderSolution(params.id, file, deliveryNote);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Deliverable submitted successfully and notified in chat.',
      order,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
