import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const queryId = params.id;
    const { expertId } = await req.json();

    if (!expertId) {
      return NextResponse.json(
        { success: false, error: 'Expert ID is required' },
        { status: 400 }
      );
    }

    // Verify expert is approved!
    const expertProfile = db.getExpertProfileByUserId(expertId);
    if (!expertProfile || expertProfile.approvalStatus !== 'APPROVED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Expert account is not approved to take assignments.',
        },
        { status: 403 }
      );
    }

    const result = db.assignExpertToQuery(queryId, expertId);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Query not found or could not be assigned' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
