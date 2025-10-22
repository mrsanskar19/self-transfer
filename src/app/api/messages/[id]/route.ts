import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const message = db.messages.find((m: any) => m.id === params.id);
    if (message) {
      return NextResponse.json(message);
    }
    return NextResponse.json({ message: 'Not Found' }, { status: 404 });
  } catch (error) {
    console.error('GET message error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}


export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const initialLength = db.messages.length;
    db.messages = db.messages.filter((m: any) => m.id !== params.id);
    
    if (db.messages.length < initialLength) {
      await saveDb(db);
      return NextResponse.json({ message: 'Message deleted' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Message not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('DELETE message error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
