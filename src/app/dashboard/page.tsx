
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/lib/types";
import { ChatInput } from "@/components/dashboard/ChatInput";
import { MessageList } from "@/components/dashboard/MessageList";
import Header from "@/components/dashboard/Header";

type SseEventData = Message | { action: 'delete'; id: string };

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [deviceInfo, setDeviceInfo] = useState<{ ip: string; userAgent: string } | null>(null);

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
          // Fetch messages
          const msgResponse = await fetch(`/api/messages`);
          if (msgResponse.ok) {
            let data: Message[] = await msgResponse.json();
            setMessages(data);
          } else {
            toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
          }

          // Fetch client IP info
           const ipResponse = await fetch('https://ipapi.co/json/');
           if(ipResponse.ok) {
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

        if ('action' in eventData && eventData.action === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== eventData.id));
        } else if('id' in eventData) {
          const newMessage = eventData as Message;
          setMessages(prev => {
            if (prev.find(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, { ...newMessage }];
          });
        }
      };

      eventSource.onerror = (err) => {
        // The browser will automatically try to reconnect.
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [user, toast]);

  useEffect(() => {
    const checkExpiredMessages = () => {
      const oneHour = 60 * 60 * 1000;
      const now = Date.now();
      
      messages.forEach(msg => {
        if (!msg.uploadedAt) return;
        const isExpired = now - new Date(msg.uploadedAt).getTime() > oneHour;
        if (isExpired) {
          fetch(`/api/messages/${msg.id}`, { method: 'DELETE' });
        }
      });
    };

    const interval = setInterval(checkExpiredMessages, 60000);
    return () => clearInterval(interval);
  }, [messages]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-muted/20 dark:bg-card">
      <Header user={user} onLogout={handleLogout} deviceInfo={deviceInfo} />
      
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
