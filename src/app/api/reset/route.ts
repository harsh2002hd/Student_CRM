import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST() {
  db.resetToSeed();
  return NextResponse.json({ success: true, message: 'Database reset to initial seed state.' });
}
