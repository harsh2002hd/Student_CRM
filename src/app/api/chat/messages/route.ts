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

    // Broadcast across Socket.io
    if (typeof global !== 'undefined' && (global as any).io) {
      const io = (global as any).io;
      io.to(`conv_${conversationId}`).emit('receive_message', {
        message: result.message,
        scanResult: result.scanResult,
      });
      io.emit('conversation_updated', {
        conversationId,
        lastMessage: result.message.content,
        lastMessageTime: result.message.timestamp,
      });
      if (result.scanResult.isViolating) {
        io.emit('flagged_incident_logged', {
          incident: {
            id: `flg_${Date.now()}`,
            messageId: result.message.id,
            conversationId,
            senderId,
            senderRole,
            senderName: senderName || 'User',
            attemptedLeakType: result.scanResult.detectedTypes,
            flaggedText: result.scanResult.originalContent,
            redactedText: result.scanResult.sanitizedContent,
            timestamp: new Date().toISOString(),
            status: 'PENDING_REVIEW',
          },
        });
      }
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
