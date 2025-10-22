
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
  const { user, deviceInfo, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Effect for fetching initial data - runs only once when the user is available
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
        } catch (error) {
          console.error("Failed to fetch initial data:", error);
          toast({ title: "Error", description: "An error occurred while fetching data.", variant: "destructive" });
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchInitialData();
    }
  }, [user, toast]);

  // Effect for handling SSE - runs only once when the user is available
  useEffect(() => {
    if (!user) return;
    
    const eventSource = new EventSource('/api/messages/events');
    
    const handleSseMessage = (event: MessageEvent) => {
      try {
        const eventData: SseEventData = JSON.parse(event.data);

        setMessages(prev => {
          if (eventData.action === 'delete') {
            return prev.filter(m => m.id !== eventData.id);
          }
          if (eventData.action === 'add') {
            const newMessage = eventData.message;
            // Avoid adding duplicates
            if (prev.some(m => m.id === newMessage.id)) {
              return prev;
            }
            // Mark as seen if not from self
            if (deviceInfo?.ip && newMessage.deviceInfo?.ip !== deviceInfo.ip) {
              fetch(`/api/messages/${newMessage.id}/seen`, { method: 'POST' });
            }
            return [...prev, newMessage].sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
          }
          if (eventData.action === 'seen') {
            return prev.map(m =>
              m.id === eventData.id && m.seenBy && !m.seenBy.includes(eventData.ip)
                ? { ...m, seenBy: [...m.seenBy, eventData.ip] }
                : m
            );
          }
          return prev;
        });

      } catch (error) {
          // This can happen if the event data is not valid JSON, we'll just ignore it.
      }
    };
    
    eventSource.onmessage = handleSseMessage;

    eventSource.onerror = (err) => {
      // Browser will auto-reconnect, no need to log error or close.
    };
    
    return () => {
      eventSource.close();
    };
  }, [user, deviceInfo?.ip]); // Depend only on user and the IP string


  if (loading || !deviceInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-muted/20 dark:bg-card">
      <Header user={user} onLogout={logout} deviceInfo={deviceInfo} messages={messages} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : messages.length > 0 ? (
          <MessageList messages={messages} currentUser={user} currentDeviceIp={deviceInfo.ip} />
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
