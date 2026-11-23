import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const banner = db.toggleAdBanner(params.id);
    if (!banner) {
      return NextResponse.json({ success: false, error: 'Banner not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, banner });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
