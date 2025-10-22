
"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { User, DeviceInfo, Message } from "@/lib/types";
import { LogOut, Settings, Monitor } from "lucide-react";
import SettingsPage from "./Settings";

interface HeaderProps {
    user: User;
    onLogout: () => void;
    deviceInfo: DeviceInfo | null;
    messages: Message[];
}

export default function Header({ user, onLogout, deviceInfo, messages }: HeaderProps) {
  return (
    <header className="p-4 border-b bg-background">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Ephemeral Vault</h1>
          <p className="text-sm text-muted-foreground">Welcome, {user.username}</p>
        </div>
        <div className="flex items-center gap-2">
           <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SettingsPage messages={messages} />
            </SheetContent>
          </Sheet>
          <Button variant="outline" size="icon" onClick={onLogout}>
            <LogOut className="h-5 w-5 text-destructive" />
          </Button>
        </div>
      </div>
      {deviceInfo && (
        <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2 border-t pt-2">
            <Monitor size={14} />
            <p className="truncate"><strong>Your IP:</strong> {deviceInfo.ip.replace('::ffff:', '')}</p>
        </div>
      )}
    </header>
  );
}
