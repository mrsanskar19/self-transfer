"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, File as FileIcon, Trash2, AlertCircle, Copy, MessageSquareText, Shield, Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MessageType = 'text' | 'file';

interface DeviceInfo {
  userAgent: string;
  ip: string;
}

interface Message {
  id: string;
  type: MessageType;
  content: string;
  userId: string;
  name?: string;
  url?: string;
  shareableUrl?: string;
  uploadedAt: string;
  deviceInfo?: DeviceInfo;
}

// SSE event can be a new message or a delete notification
type SseEventData = Message | { action: 'delete'; id: string };

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        setIsLoadingMessages(true);
        try {
          const response = await fetch(`/api/messages`);
          if (response.ok) {
            let data: Message[] = await response.json();
            setMessages(data);
          } else {
            toast({ title: "Error", description: "Failed to load messages.", variant: "destructive" });
          }
        } catch (error) {
          console.error("Failed to fetch messages:", error);
          toast({ title: "Error", description: "An error occurred while fetching messages.", variant: "destructive" });
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();

      const eventSource = new EventSource('/api/messages/events');
      
      eventSource.onmessage = (event) => {
        const eventData: SseEventData = JSON.parse(event.data);

        if ('action' in eventData && eventData.action === 'delete') {
          setMessages(prev => prev.filter(m => m.id !== eventData.id));
        } else if('id' in eventData) {
          const newMessage = eventData as Message;
          setMessages(prev => {
            // Add new message if it doesn't already exist
            if (prev.find(m => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      };

      eventSource.onerror = (err) => {
        // The browser will automatically try to reconnect, so we don't need to
        // close the connection or log every error. We can just let it be.
      };
      
      return () => {
        eventSource.close();
      };
    }
  }, [user, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkExpiredMessages = () => {
      const oneHour = 60 * 60 * 1000;
      const now = Date.now();
      
      messages.forEach(msg => {
        const isExpired = now - new Date(msg.uploadedAt).getTime() > oneHour;
        if (isExpired) {
          // Trigger deletion on the backend which will notify via SSE
          fetch(`/api/messages/${msg.id}`, { method: 'DELETE' });
        }
      });
    };

    const interval = setInterval(checkExpiredMessages, 60000);
    return () => clearInterval(interval);
  }, [messages]);

  const handleFileTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage(selectedFile.name); 
    }
  };
  
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  const handleSend = async () => {
    if (!file && !message.trim()) return;
    if (!user) return;

    let newMessagePayload: Omit<Message, 'id' | 'shareableUrl' | 'uploadedAt'>;
    
    setIsUploading(true);

    try {
        if (file) {
          const dataUrl = await fileToBase64(file);
          newMessagePayload = {
            type: 'file',
            content: file.name,
            name: file.name,
            url: dataUrl,
            userId: user.username,
          };
        } else {
          newMessagePayload = {
            type: 'text',
            content: message,
            userId: user.username,
          };
        }
        
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMessagePayload),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }
    } catch (error) {
       toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
    } finally {
        setIsUploading(false);
        setFile(null);
        setMessage("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
    }
  };

  const handleDelete = async (messageId: string) => {
    setDeletingId(messageId);
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({ title: "Error", description: "Could not delete message.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyToClipboard = (shareableUrl: string) => {
    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({ title: "Copied!", description: "Shareable link copied to clipboard." });
    });
  };

  const handleShareViaText = (shareableUrl: string) => {
    const messageBody = `Here is the file you requested: ${shareableUrl}`;
    const smsLink = `sms:?&body=${encodeURIComponent(messageBody)}`;
    window.location.href = smsLink;
  };
  
  const getInitials = (name: string) => name?.[0]?.toUpperCase() ?? 'U';

  const renderMessageContent = (msg: Message) => {
    if (msg.type === 'file') {
      return (
        <div className="flex items-center gap-3">
          <FileIcon className="h-6 w-6 flex-shrink-0" />
          <p className="font-medium truncate" title={msg.name}>{msg.name}</p>
        </div>
      );
    }
    return <p>{msg.content}</p>;
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-muted/20 dark:bg-card">
      <header className="p-4 border-b bg-background">
        <h1 className="text-xl font-bold">Ephemeral Vault</h1>
        <p className="text-sm text-muted-foreground">Your temporary file & text messenger</p>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {isLoadingMessages ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : messages.length > 0 ? (
            messages.map(msg => (
            <div key={msg.id}>
              {msg.userId === user.username ? (
                // User's Message (Sent)
                <div className="flex justify-end items-start gap-3 mb-4">
                  <div className="flex flex-col items-end gap-1 max-w-xs lg:max-w-md">
                     <div className="p-3 rounded-2xl rounded-br-lg bg-primary text-primary-foreground">
                        {renderMessageContent(msg)}
                     </div>
                     <div className="flex items-center gap-3">
                        {msg.deviceInfo && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5" title={`${msg.deviceInfo.userAgent} (IP: ${msg.deviceInfo.ip})`}>
                                <Shield size={12} />
                                <span>From your device</span>
                            </div>
                        )}
                        <Button onClick={() => handleDelete(msg.id)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deletingId === msg.id}>
                            {deletingId === msg.id ? <Loader2 className="animate-spin" size={12}/> : <Trash2 size={12} />}
                        </Button>
                      </div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                // Other User's Message (Received)
                <div className="flex justify-start items-start gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials(msg.userId)}</AvatarFallback>
                  </Avatar>
                   <div className="flex flex-col items-start gap-1 max-w-xs lg:max-w-md">
                        <div className="p-3 rounded-2xl rounded-bl-lg bg-background dark:bg-muted">
                            {renderMessageContent(msg)}
                        </div>
                         {msg.deviceInfo && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1.5" title={`${msg.deviceInfo.userAgent} (IP: ${msg.deviceInfo.ip})`}>
                                <Shield size={12} />
                                <span>From {msg.userId}</span>
                            </div>
                        )}
                   </div>
                </div>
              )}

              {/* Vault's Reply to user's own file messages */}
              {msg.userId === user.username && msg.type === 'file' && msg.shareableUrl && (
                    <div className="flex justify-start items-end gap-3 mb-4">
                      <Avatar className="h-8 w-8">
                          <AvatarFallback><Shield className="h-4 w-4"/></AvatarFallback>
                      </Avatar>
                      <div className="max-w-xs lg:max-w-md space-y-2">
                        <Card className="bg-background dark:bg-muted">
                          <CardContent className="p-3 space-y-3">
                             <div>
                                <p className="font-semibold text-sm mb-1">File Secured!</p>
                                <p className="text-xs text-muted-foreground">
                                    Link expires at: {new Date(new Date(msg.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                                </p>
                             </div>
                            <div className="flex gap-2">
                                <Input id={`share-link-${msg.id}`} type="text" readOnly value={msg.shareableUrl} className="bg-background h-9 text-xs"/>
                                <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(msg.shareableUrl!)} title="Copy Link" className="h-9 w-9">
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={() => handleShareViaText(msg.shareableUrl!)} title="Share via Text" className="h-9 w-9">
                                  <MessageSquareText className="h-4 w-4" />
                                </Button>
                            </div>
                             <Button onClick={() => handleDelete(msg.id)} variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deletingId === msg.id}>
                                {deletingId === msg.id ? <Loader2 className="mr-2 animate-spin" size={16}/> : <Trash2 className="mr-2" size={16}/>}
                                Delete & Invalidate Link
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
              )}
            </div>
            ))
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
        <div ref={messagesEndRef} />
      </main>
      
      <footer className="p-4 border-t bg-background">
          {isUploading && file && (
             <div className="mb-2">
                <Progress value={isUploading ? 50 : 0} className="w-full h-1" />
                <p className="text-xs text-center text-muted-foreground mt-1">Uploading {file.name}...</p>
             </div>
           )}
          <div className="relative">
            <Input 
              type="text" 
              placeholder={file ? file.name : "Send a message or select a file..."}
              value={message}
              onChange={(e) => {
                if (!file) {
                  setMessage(e.target.value)
                }
              }}
              onKeyDown={(e) => e.key === 'Enter' && !isUploading && handleSend()}
              className="pr-24 pl-10"
              disabled={isUploading}
            />
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
            <div className="absolute top-1/2 left-2 -translate-y-1/2">
                <Button variant="ghost" size="icon" onClick={handleFileTrigger} disabled={isUploading} className="h-8 w-8">
                  <Paperclip className="h-5 w-5 text-muted-foreground"/>
                </Button>
            </div>
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
              <Button onClick={handleSend} disabled={(!file && !message.trim()) || isUploading} size="icon" className="h-8 w-8">
                {isUploading && !file ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5"/>}
              </Button>
            </div>
          </div>
      </footer>
    </div>
  );
}
