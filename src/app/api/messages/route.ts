import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import path from 'path';
import fs from 'fs/promises';

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

function getUsernameFromSession() {
    // In a real app, you'd get this from a secure session cookie or token.
    // For this example, we'll assume a header is sent.
    // This is NOT secure for production.
    const headersList = headers();
    const userStr = headersList.get('X-User');
    if (userStr) {
        try {
            return JSON.parse(userStr).username;
        } catch {
            return null;
        }
    }
    return null;
}

export async function GET(request: Request) {
    // This is insecure, but for a local network demo it's simple.
    // In a real app, use JWTs or a session library.
    const url = new URL(request.url)
    const username = url.searchParams.get('username');

    try {
        const db = await getDb();
        const userMessages = db.messages.filter((m: any) => m.userId === username);
        return NextResponse.json(userMessages);
    } catch (error) {
        console.error('GET messages error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const id = Date.now().toString();
    const shareableUrl = `${new URL(request.url).origin}/shared/${id}`;

    const newMessage = {
      id,
      uploadedAt: new Date().toISOString(),
      shareableUrl,
      ...body
    };

    db.messages.push(newMessage);
    await saveDb(db);

    return NextResponse.json(newMessage, { status: 201 });
  } catch (error) {
    console.error('POST message error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
