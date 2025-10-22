
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import path from 'path';
import fs from 'fs/promises';
import { broadcastMessage } from './events/route';
import { Message } from '@/lib/types';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(path.dirname(dbPath), { recursive: true });
      const initialData = { users: [], messages: [] };
      await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    throw error;
  }
}

async function saveDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Get all messages but WITHOUT file content (url)
export async function GET(request: Request) {
    try {
        const db = await getDb();
        // Don't send file content (url) on the main GET request
        const messagesWithoutContent = db.messages.map((m: any) => {
            const { url, ...rest } = m;
            return rest;
        });
        return NextResponse.json(messagesWithoutContent);
    } catch (error) {
        console.error('GET messages error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const headerList = headers();
    
    const id = Date.now().toString();
    const shareableUrl = body.type === 'file' ? `${new URL(request.url).origin}/shared/${id}` : undefined;

    const newMessage: Message = {
      id,
      uploadedAt: new Date().toISOString(),
      shareableUrl,
      seen: false,
      deviceInfo: {
        userAgent: headerList.get('user-agent') || 'Unknown',
        ip: headerList.get('x-forwarded-for') || request.headers.get('host')?.split(':')[0] || 'Unknown',
      },
      ...body
    };

    db.messages.push(newMessage);
    await saveDb(db);

    // Don't broadcast the full file content (url)
    const { url, ...messageToBroadcast } = newMessage;
    broadcastMessage(messageToBroadcast);

    return NextResponse.json(messageToBroadcast, { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
