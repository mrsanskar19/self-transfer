
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { headers } from 'next/headers';
import { broadcastMessage } from '../../events/route';

const dbPath = path.join(process.cwd(), 'src', 'app', 'api', 'temp', 'db.json');

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

// Mark a message as seen
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const message = db.messages.find((m: any) => m.id === params.id);
    
    if (message) {
      const headerList = headers();
      const ip = headerList.get('x-forwarded-for') || request.headers.get('host')?.split(':')[0] || 'Unknown';
      const cleanIp = ip.startsWith('::ffff:') ? ip.substring(7) : ip;

      if (!message.seenBy.includes(cleanIp)) {
        message.seenBy.push(cleanIp);
        await saveDb(db);
        
        broadcastMessage({ action: 'seen', id: params.id, ip: cleanIp });
      }
      return NextResponse.json({ message: 'Seen status updated' }, { status: 200 });
    }
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  } catch (error) {
    console.error('POST seen error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
