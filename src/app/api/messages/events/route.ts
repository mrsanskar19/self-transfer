// src/app/api/messages/events/route.ts
import { NextResponse } from 'next/server';

type Client = (message: string) => void;

// This is a simple in-memory store for active client connections.
// In a production/scaled environment, a more robust solution like Redis would be needed.
// Using a global variable to persist between requests in development.
declare global {
  var clients: Set<Client>;
}

if (!global.clients) {
  global.clients = new Set<Client>();
}

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

      global.clients.add(sendEvent);
      console.log('SSE client connected. Total clients:', global.clients.size);

      request.signal.addEventListener('abort', () => {
        global.clients.delete(sendEvent);
        controller.close();
        console.log('SSE client disconnected. Total clients:', global.clients.size);
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

// This function will be called by our other API routes
export function broadcastMessage(message: any) {
    const messageString = JSON.stringify(message);
    console.log(`Broadcasting message to ${global.clients.size} clients.`);
    for (const sendEvent of global.clients) {
        sendEvent(messageString);
    }
}
