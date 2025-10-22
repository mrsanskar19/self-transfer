import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { headers } from 'next/headers';

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

async function saveDb(data: any) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const db = await getDb();
    const headerList = headers();

    const user = db.users.find(
      (user: any) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
    );

    if (user) {
      const ip = (headerList.get('x-forwarded-for') ?? '127.0.0.1').split(',')[0].trim();
      const userAgent = headerList.get('user-agent') || 'Unknown';
      
      const newDevice = { ip, userAgent };

      if (!user.loginedDevices) {
        user.loginedDevices = [];
      }
      
      const deviceExists = user.loginedDevices.some(
        (d: any) => d.ip === newDevice.ip && d.userAgent === newDevice.userAgent
      );

      if (!deviceExists) {
        user.loginedDevices.push(newDevice);
        await saveDb(db);
      }

      return NextResponse.json({ message: 'Login successful', ip, userAgent }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
