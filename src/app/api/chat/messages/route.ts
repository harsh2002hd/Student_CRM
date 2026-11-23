import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UserRole } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json(
      { success: false, error: 'Conversation ID is required' },
      { status: 400 }
    );
  }

  const messages = db.getMessagesByConversationId(conversationId);
  return NextResponse.json({ success: true, messages });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, senderId, senderRole, senderName, content, attachment } = body;

    if (!conversationId || !senderId || (!content && !attachment)) {
      return NextResponse.json(
        { success: false, error: 'Missing required message parameters' },
        { status: 400 }
      );
    }

    const result = db.sendMessage({
      conversationId,
      senderId,
      senderRole: senderRole as UserRole,
      senderName: senderName || 'User',
      content: content || '',
      attachment,
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      scanResult: result.scanResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
