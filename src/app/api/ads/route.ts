import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get('all') === 'true';

  const banners = all ? db.getAdBanners() : db.getActiveAdBanners();
  return NextResponse.json({ success: true, banners });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subtitle, badge, imageUrl, ctaText, ctaLink, category, isActive } = body;

    if (!title || !subtitle || !imageUrl) {
      return NextResponse.json(
        { success: false, error: 'Title, subtitle, and image URL are required' },
        { status: 400 }
      );
    }

    const banner = db.createAdBanner({
      title,
      subtitle,
      badge: badge || 'Special Offer',
      imageUrl,
      ctaText: ctaText || 'View Details',
      ctaLink: ctaLink || '#',
      category: category || 'General',
      isActive: isActive !== false,
    });

    return NextResponse.json({ success: true, banner });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
