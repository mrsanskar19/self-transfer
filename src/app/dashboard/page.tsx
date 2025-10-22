
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message, DeviceInfo } from "@/lib/types";
import { ChatInput } from "@/components/dashboard/ChatInput";
import { MessageList } from "@/components/dashboard/MessageList";
import Header from "@/components/dashboard/Header";

type SseEventData = 
  | { action: 'delete'; id: string }
  | { action: 'add'; message: Message }
  | { action: 'seen'; id: string; ip: string };

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  const updateMessageSeen = useCallback(async (msgId: string, seenIp: string) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === msgId && !m.seenBy.includes(seenIp)
          ? { ...m, seenBy: [...m.seenBy, seenIp] }
          : m
      )
    );
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const fetchInitialData = async () => {
        setIsLoadingMessages(true);
        try {
          const msgResponse = await fetch(`/api/messages`);
          if (msgResponse.ok) {
            const data: Message[] = await msgResponse.json();
            setMessages(data);
          } else {
            toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
          }

          const ipResponse = await fetch('https://ipapi.co/json/');
          if (ipResponse.ok) {
            const ipData = await ipResponse.json();
            setDeviceInfo({ ip: ipData.ip, userAgent: navigator.userAgent });
          }
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          toast({ title: "Error", description: "An error occurred while fetching data.", variant: "destructive" });
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchInitialData();

      const eventSource = new EventSource('/api/messages/events');
      
      eventSource.onmessage = (event) => {
        const eventData: SseEventData = JSON.parse(event.data);

        if (eventData.action === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== eventData.id));
        } else if (eventData.action === 'add') {
          setMessages(prev => {
            if (prev.find(m => m.id === eventData.message.id)) {
              return prev;
            }
            return [...prev, eventData.message];
          });
          // Mark as seen if not from self
          if (deviceInfo && eventData.message.deviceInfo?.ip !== deviceInfo.ip) {
            fetch(`/api/messages/${eventData.message.id}/seen`, { method: 'POST' });
          }
        } else if (eventData.action === 'seen') {
            updateMessageSeen(eventData.id, eventData.ip);
        }
      };

      eventSource.onerror = (err) => {
        // Browser will auto-reconnect
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [user, toast, deviceInfo, updateMessageSeen]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-muted/20 dark:bg-card">
      <Header user={user} onLogout={logout} deviceInfo={deviceInfo} messages={messages} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : messages.length > 0 ? (
          <MessageList messages={messages} currentUser={user} />
        ) : (
          <div className="flex justify-center items-center h-full">
            <Alert className="max-w-md text-center bg-background">
              <AlertCircle className="h-4 w-4 mx-auto mb-2" />
              <AlertTitle>Vault is Empty</AlertTitle>
              <AlertDescription>
                Use the input below to send a message or upload a file.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
      
      <ChatInput currentUser={user} />
    </div>
  );
}
