import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const mimeType = file.type || 'application/octet-stream';
    let fileUrl = '';

    // Check if running on Vercel or AWS Lambda serverless (read-only filesystem)
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

    if (!isServerless) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Clean safe filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;
        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);
        fileUrl = `/uploads/${filename}`;
      } catch (fsErr: any) {
        console.warn('Filesystem write not available (read-only environment):', fsErr.message);
      }
    }

    // In serverless / Vercel environments or when filesystem is read-only (EROFS):
    // Generate self-contained Base64 Data URL so sharing documents & images works with zero external storage or EROFS crashes
    if (!fileUrl) {
      const base64Data = buffer.toString('base64');
      fileUrl = `data:${mimeType};base64,${base64Data}`;
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        size: sizeFormatted,
        type: mimeType,
        url: fileUrl,
      },
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ success: false, error: err.message || 'File upload error' }, { status: 500 });
  }
}
