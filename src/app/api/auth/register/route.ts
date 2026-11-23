import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      password,
      role = 'STUDENT',
      country,
      currency,
      phone,
      institution,
      major,
      title,
      bio,
      subjects,
      qualifications,
      hourlyRate,
      verificationDoc,
      initialMessage,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name is required for instant direct registration.' },
        { status: 400 }
      );
    }

    const cleanHandle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const effectiveEmail = email && email.trim().length > 0 
      ? email.trim() 
      : `${cleanHandle || 'lead'}_${Date.now()}@m1company.internal`;
    const effectivePassword = password && password.trim().length > 0 
      ? password 
      : 'direct_access';

    const regResult = db.registerUser({
      name: name.trim(),
      email: effectiveEmail,
      password: effectivePassword,
      role,
      country: country || 'US',
      currency: currency || 'USD',
      phone: phone || '+1 555 0199',
      institution,
      major,
      title,
      bio,
      subjects,
      qualifications,
      hourlyRate,
      verificationDoc,
      initialMessage,
    });

    const newUser = regResult.user;
    const createdConv = regResult.conversation;
    const createdMsg = regResult.message;

    // Real-time broadcast to Admin & Agents via Socket.io
    try {
      const io = (global as any).io;
      if (io && createdConv && createdMsg) {
        io.emit('receive_message', {
          message: createdMsg,
          scanResult: { isViolating: false },
        });
        io.emit('conversation_updated', {
          conversationId: createdConv.id,
          lastMessage: createdMsg.content,
          lastMessageTime: createdMsg.timestamp,
        });
        io.emit('new_lead_registered', {
          user: newUser,
          conversation: createdConv,
          message: createdMsg,
        });
      }
    } catch (e) {
      console.warn('Socket emit on register error', e);
    }

    return NextResponse.json({
      success: true,
      user: newUser,
      conversation: createdConv,
      message: role === 'EXPERT'
        ? 'Expert registration received. Profile and introduction queued for Admin verification.'
        : `Welcome to M1 Company, ${newUser.name}! Your direct support chat is active.`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
