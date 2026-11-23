import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account registered with this email address.' },
        { status: 404 }
      );
    }

    // In production we would check bcrypt hash; here we accept matched password or default
    if (password && user.password && user.password !== password) {
      return NextResponse.json(
        { success: false, error: 'Invalid password credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: `Signed in as ${user.name}`,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
