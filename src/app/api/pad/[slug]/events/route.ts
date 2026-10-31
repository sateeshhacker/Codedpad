import { NextRequest } from 'next/server';
import { subscribePadUpdate } from '@/lib/syncEvents';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug?.trim().toLowerCase();
  if (!slug) {
    return new Response('Invalid slug', { status: 400 });
  }

  const encoder = new TextEncoder();

  let unsubscribe: (() => void) | null = null;
  let keepAliveTimer: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connected notification
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ slug, status: 'listening' })}\n\n`));

      // Subscribe to real-time updates for this slug
      unsubscribe = subscribePadUpdate(slug, (eventData) => {
        try {
          controller.enqueue(
            encoder.encode(`event: pad_update\ndata: ${JSON.stringify(eventData)}\n\n`)
          );
        } catch (err) {
          console.error('SSE enqueue error:', err);
        }
      });

      // Send periodic keep-alive ping every 15s to keep connection open
      keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          if (keepAliveTimer) clearInterval(keepAliveTimer);
        }
      }, 15000);
    },
    cancel() {
      if (unsubscribe) {
        unsubscribe();
      }
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
