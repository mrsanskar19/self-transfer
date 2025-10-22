// src/app/api/messages/events/route.ts

import { NextResponse } from 'next/server';

// This is a simple in-memory store for active client connections.
// In a production/scaled environment, a more robust solution like Redis would be needed.
const clients = new Set<(message: string) => void>();

export async function GET(request: Request) {
  // SSE requires a specific response header and a long-lived connection.
  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (message: string) => {
        try {
          controller.enqueue(`data: ${message}\n\n`);
        } catch (e) {
          console.error("SSE Error:", e);
        }
      };

      clients.add(sendEvent);
      console.log('SSE client connected. Total clients:', clients.size);

      request.signal.addEventListener('abort', () => {
        clients.delete(sendEvent);
        controller.close();
        console.log('SSE client disconnected. Total clients:', clients.size);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// This function will be called by our POST /api/messages route
export function broadcastMessage(message: any) {
    const messageString = JSON.stringify(message);
    console.log(`Broadcasting message to ${clients.size} clients.`);
    for (const sendEvent of clients) {
        sendEvent(messageString);
    }
}
