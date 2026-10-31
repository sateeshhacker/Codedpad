import { NextRequest, NextResponse } from 'next/server';
import { getPad, savePad, deletePad } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.trim().toLowerCase();
    if (!slug || !/^[a-zA-Z0-9_-]{2,64}$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid pad identifier' }, { status: 400 });
    }

    const pad = getPad(slug);
    if (!pad) {
      return NextResponse.json({
        exists: false,
        slug,
      });
    }

    return NextResponse.json({
      exists: true,
      slug: pad.slug,
      encryptedContent: pad.encrypted_content,
      version: pad.version,
      expiresAt: pad.expires_at,
      burnAfterRead: pad.burn_after_read === 1,
      viewCount: pad.view_count,
      updatedAt: pad.updated_at,
    });
  } catch (error: any) {
    console.error('API GET /pad error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.trim().toLowerCase();
    if (!slug || !/^[a-zA-Z0-9_-]{2,64}$/.test(slug)) {
      return NextResponse.json({ error: 'Invalid pad identifier' }, { status: 400 });
    }

    const body = await request.json();
    const { encryptedContent, initHash, currentHash, expiresAt, burnAfterRead } = body;

    if (!encryptedContent || typeof encryptedContent !== 'string') {
      return NextResponse.json({ error: 'Missing encrypted content' }, { status: 400 });
    }

    if (!currentHash || typeof currentHash !== 'string') {
      return NextResponse.json({ error: 'Missing current hash authorization proof' }, { status: 400 });
    }

    const result = savePad({
      slug,
      encryptedContent,
      initHash,
      currentHash,
      expiresAt: expiresAt ? Number(expiresAt) : null,
      burnAfterRead: Boolean(burnAfterRead),
    });

    return NextResponse.json({
      success: true,
      version: result.version,
      slug,
    });
  } catch (error: any) {
    console.error('API POST /pad error:', error);
    if (error.message?.includes('CONCURRENCY_CONFLICT')) {
      return NextResponse.json(
        { error: 'Conflict: This pad was updated by another session or authorization proof failed.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || 'Failed to save pad' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug?.trim().toLowerCase();
    if (!slug) {
      return NextResponse.json({ error: 'Invalid pad identifier' }, { status: 400 });
    }

    const body = await request.json();
    const { initHash } = body;

    if (!initHash) {
      return NextResponse.json({ error: 'Missing deletion authorization proof' }, { status: 400 });
    }

    const deleted = deletePad(slug, initHash);
    if (!deleted) {
      return NextResponse.json({ error: 'Pad not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Pad securely deleted' });
  } catch (error: any) {
    console.error('API DELETE /pad error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete pad' }, { status: 403 });
  }
}
