
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, UploadCloud, File as FileIcon, Download, Trash2, AlertCircle, Copy, MessageSquareText, Shield, Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type MessageType = 'text' | 'file';

interface Message {
  id: string;
  type: MessageType;
  content: string;
  name?: string;
  url?: string;
  shareableUrl?: string;
  uploadedAt: string;
  deviceInfo?: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem("ephemeral-messages");
      if (storedMessages) {
        const parsedMessages: Message[] = JSON.parse(storedMessages);
        const oneHour = 60 * 60 * 1000;
        
        const validMessages = parsedMessages.filter(msg => {
          if (msg.type === 'file') {
            const isExpired = Date.now() - new Date(msg.uploadedAt).getTime() > oneHour;
            if (isExpired) {
               toast({
                 title: "File Expired",
                 description: `Your file "${msg.name}" was older than 1 hour and has been removed.`,
                 variant: "destructive"
               });
               // Revoke blob URL to free memory
               if (msg.url?.startsWith('blob:')) {
                  URL.revokeObjectURL(msg.url);
               }
               return false;
            }
          }
          return true;
        });

        setMessages(validMessages);
        if (validMessages.length !== parsedMessages.length) {
          localStorage.setItem("ephemeral-messages", JSON.stringify(validMessages));
        }
      }
    } catch(e) {
      console.error("Failed to parse messages from local storage", e);
    }
    setIsLoadingMessages(false);
  }, [toast]);
  
  useEffect(() => {
    // Cleanup blob URLs on unmount
    return () => {
      messages.forEach(msg => {
        if (msg.type === 'file' && msg.url?.startsWith('blob:')) {
          URL.revokeObjectURL(msg.url);
        }
      });
    };
  }, [messages]);

  const handleFileTrigger = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setMessage(selectedFile.name); // Show file name in input
    }
  };

  const handleSend = async () => {
    if (!file && !message.trim()) return;

    let newMessage: Message;

    if (file) {
      setIsUploading(true);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const objectUrl = URL.createObjectURL(file);
      const fileId = `${Date.now()}-${file.name}`;
      const shareableUrl = `${window.location.origin}/shared/${btoa(fileId)}`;

      newMessage = {
        id: fileId,
        type: 'file',
        content: file.name,
        name: file.name,
        url: objectUrl,
        shareableUrl: shareableUrl,
        uploadedAt: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
      };

      setIsUploading(false);
      setFile(null);
      toast({ title: "Success", description: "Your file is now in the vault." });
    } else {
      newMessage = {
        id: `${Date.now()}`,
        type: 'text',
        content: message,
        uploadedAt: new Date().toISOString(),
      };
    }
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem("ephemeral-messages", JSON.stringify(updatedMessages));
    setMessage("");
  };

  const handleDownload = (msg: Message) => {
    if (msg.type !== 'file' || !msg.url || !msg.name) return;

    const link = document.createElement('a');
    link.href = msg.url;
    link.setAttribute('download', msg.name);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    
    toast({ title: "Downloaded", description: "File downloaded. It will now be deleted." });
    
    handleDelete(msg.id, msg.url);
  };

  const handleDelete = async (messageId: string, url?: string) => {
    setIsDeleting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    localStorage.setItem("ephemeral-messages", JSON.stringify(updatedMessages));
    
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }

    setIsDeleting(false);
    toast({ title: "Deleted", description: "The message has been successfully deleted." });
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
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-card">
      <header className="p-4 border-b">
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
              {/* User's Message */}
              <div className="flex justify-end items-end gap-3 mb-4">
                 <div className="max-w-xs lg:max-w-md p-4 rounded-lg rounded-br-none bg-primary text-primary-foreground">
                    {renderMessageContent(msg)}
                </div>
                <Avatar>
                  <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                </Avatar>
              </div>

              {/* Vault's Reply */}
              {msg.type === 'file' && msg.shareableUrl && (
                <div className="flex justify-start items-end gap-3">
                   <Avatar>
                      <AvatarFallback><Shield className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                  <div className="max-w-xs lg:max-w-md space-y-4">
                    <div className="p-4 rounded-lg rounded-bl-none bg-muted">
                      <p className="font-semibold text-sm mb-2">File Secured in Vault!</p>
                      <p className="text-xs text-muted-foreground">
                        Expires at: {new Date(new Date(msg.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                      </p>
                      {msg.deviceInfo && (
                        <div className="mt-4 p-2 border rounded-md bg-background/50 text-xs flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                           <p className="truncate text-muted-foreground" title={msg.deviceInfo}>
                            From: {msg.deviceInfo}
                           </p>
                        </div>
                      )}
                    </div>
                    <Card className="bg-muted">
                      <CardContent className="p-4 space-y-4">
                        <div>
                          <Label htmlFor={`share-link-${msg.id}`}>Shareable Link</Label>
                          <div className="flex gap-2 mt-1">
                            <Input id={`share-link-${msg.id}`} type="text" readOnly value={msg.shareableUrl} className="bg-background h-9"/>
                            <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(msg.shareableUrl!)} title="Copy Link" className="h-9 w-9">
                              <Copy className="h-4 w-4" />
                            </Button>
                             <Button variant="outline" size="icon" onClick={() => handleShareViaText(msg.shareableUrl!)} title="Share via Text" className="h-9 w-9">
                              <MessageSquareText className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button onClick={() => handleDownload(msg)} size="sm">
                            <Download className="mr-2" />
                            Download
                          </Button>
                          <Button onClick={() => handleDelete(msg.id, msg.url)} variant="destructive" size="sm" disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
               {msg.type === 'text' && (
                 <div className="flex justify-start items-end gap-3">
                   <Avatar>
                      <AvatarFallback><Shield className="h-5 w-5"/></AvatarFallback>
                  </Avatar>
                  <div className="max-w-xs lg:max-w-md space-y-4">
                    <div className="p-4 rounded-lg rounded-bl-none bg-muted">
                      <p className="font-semibold text-sm mb-2">Message Stored.</p>
                      <p className="text-xs text-muted-foreground">This is a temporary text message.</p>
                       <Button onClick={() => handleDelete(msg.id)} variant="destructive" size="sm" className="mt-4 w-full" disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : <Trash2 className="mr-2" />}
                          Delete Message
                        </Button>
                    </div>
                  </div>
                </div>
               )}
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-full">
                <Alert className="max-w-md text-center">
                  <AlertCircle className="h-4 w-4 mx-auto mb-2" />
                  <AlertTitle>Vault is Empty</AlertTitle>
                  <AlertDescription>
                    Use the input below to send a message or upload a file.
                  </AlertDescription>
                </Alert>
            </div>
        )}
      </main>
      
      <footer className="p-4 border-t bg-background">
          {isUploading && (
             <div className="mb-2">
                <Progress value={isUploading ? 50 : 0} className="w-full h-2" />
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-20"
            />
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden"/>
            <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleFileTrigger} disabled={isUploading}>
                <Paperclip className="h-5 w-5"/>
              </Button>
              <Button onClick={handleSend} disabled={(!file && !message.trim()) || isUploading} size="icon">
                {isUploading ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5"/>}
              </Button>
            </div>
          </div>
      </footer>
    </div>
  );
}

    