import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function getDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If the file doesn't exist, create it with an empty structure
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const initialData = { users: [], messages: [] };
      await fs.writeFile(dbPath, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await getDb();

    const user = db.users.find(
      (user: any) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (user) {
      return NextResponse.json({ message: 'Login successful' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
