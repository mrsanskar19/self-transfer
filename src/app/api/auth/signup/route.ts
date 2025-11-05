import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';

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

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await getDb();

    const existingUser = db.users.find(
      (user: any) => user.username.toLowerCase() === username.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json({ message: 'Username already exists' }, { status: 409 });
    }

    const newUser = { id: Date.now().toString(), username, password };
    db.users.push(newUser);
    await saveDb(db);

    return NextResponse.json({ message: 'User created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
