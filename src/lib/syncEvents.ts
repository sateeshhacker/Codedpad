import { EventEmitter } from 'node:events';

// Global event bus cached across Next.js module reloads
const globalEmitter = (global as any).__padEventEmitter || new EventEmitter();
globalEmitter.setMaxListeners(200);

if (process.env.NODE_ENV !== 'production') {
  (global as any).__padEventEmitter = globalEmitter;
}

export function broadcastPadUpdate(slug: string, version: number) {
  const channel = 'pad_update:' + slug.toLowerCase();
  globalEmitter.emit(channel, {
    slug: slug.toLowerCase(),
    version,
    updatedAt: Date.now(),
  });
}

export function subscribePadUpdate(
  slug: string,
  callback: (data: { slug: string; version: number; updatedAt: number }) => void
): () => void {
  const channel = 'pad_update:' + slug.toLowerCase();
  globalEmitter.on(channel, callback);
  return () => {
    globalEmitter.off(channel, callback);
  };
}
