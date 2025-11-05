
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

// Get all users
export async function GET(request: Request) {
    try {
        const db = await getDb();
        return NextResponse.json(db.users);
    } catch (error) {
        console.error('GET users error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
