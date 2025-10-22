
export type MessageType = 'text' | 'file';

export interface DeviceInfo {
  userAgent: string;
  ip: string;
}

export interface Message {
  id: string;
  type: MessageType;
  content: string;
  userId: string;
  name?: string;
  url?: string; // The base64 data URL for files, only sent on direct fetch
  shareableUrl?: string;
  uploadedAt: string;
  deviceInfo?: DeviceInfo;
  seenBy: string[]; // Array of IP addresses that have seen the message
}

export interface User {
  username: string;
  name?: string;
  email?: string;
  loginedDevices?: DeviceInfo[];
}
