import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const flagged = db.getFlaggedMessages();
  return NextResponse.json({ success: true, flaggedMessages: flagged });
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status, customWarning } = await req.json();
    const result = db.updateFlaggedMessageStatus(id, status, customWarning);
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Flagged message record not found' },
        { status: 404 }
      );
    }

    // Socket.io real-time broadcast
    if (typeof global !== 'undefined' && (global as any).io) {
      const io = (global as any).io;
      io.emit('flagged_incident_updated', {
        id,
        status,
        item: result.item,
      });

      if (status === 'WARNING_ISSUED' && result.warningMessage) {
        io.to(`conv_${result.warningMessage.conversationId}`).emit('receive_message', {
          message: result.warningMessage,
        });
        io.emit('conversation_updated', {
          conversationId: result.warningMessage.conversationId,
          lastMessage: result.warningMessage.content,
          lastMessageTime: result.warningMessage.timestamp,
        });
      }
    }

    return NextResponse.json({
      success: true,
      updated: result.item,
      warningMessage: result.warningMessage,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      db.clearFlaggedMessages();
      if (typeof global !== 'undefined' && (global as any).io) {
        (global as any).io.emit('flagged_incident_cleared');
      }
      return NextResponse.json({ success: true, message: 'All flagged incidents cleared' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing incident ID' }, { status: 400 });
    }

    const deleted = db.deleteFlaggedMessage(id);
    if (deleted && typeof global !== 'undefined' && (global as any).io) {
      (global as any).io.emit('flagged_incident_deleted', { id });
    }

    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { senderId, senderRole, senderName, conversationId, content } = await req.json();

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
    }

    const result = db.createFlaggedIncident({
      senderId: senderId || 'usr_stu_1',
      senderRole: senderRole || 'STUDENT',
      senderName: senderName || 'David Miller (STU-9382)',
      conversationId,
      content,
    });

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Message does not violate zero contact leakage rules (no phone, email, or social handle detected).',
      });
    }

    // Broadcast through socket.io
    if (typeof global !== 'undefined' && (global as any).io) {
      const io = (global as any).io;
      io.emit('flagged_incident_logged', { incident: result.incident });
      io.to(`conv_${result.message.conversationId}`).emit('receive_message', {
        message: result.message,
        scanResult: result.scanResult,
      });
      io.emit('conversation_updated', {
        conversationId: result.message.conversationId,
        lastMessage: result.message.content,
        lastMessageTime: result.message.timestamp,
      });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
