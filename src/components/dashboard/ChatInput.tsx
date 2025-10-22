
"use client";

import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Paperclip, Send } from "lucide-react";
import { Progress } from "../ui/progress";
import { User, Message } from "@/lib/types";


interface ChatInputProps {
    currentUser: User;
}

export function ChatInput({ currentUser }: ChatInputProps) {
    const [message, setMessage] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

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
        if (!currentUser) return;

        let newMessagePayload: Omit<Message, 'id' | 'shareableUrl' | 'uploadedAt' | 'deviceInfo' | 'seen'>;

        setIsUploading(true);

        try {
            if (file) {
                const dataUrl = await fileToBase64(file);
                newMessagePayload = {
                    type: 'file',
                    content: file.name,
                    name: file.name,
                    url: dataUrl,
                    userId: currentUser.username,
                };
            } else {
                newMessagePayload = {
                    type: 'text',
                    content: message,
                    userId: currentUser.username,
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

    return (
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
                <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="absolute top-1/2 left-2 -translate-y-1/2">
                    <Button variant="ghost" size="icon" onClick={handleFileTrigger} disabled={isUploading} className="h-8 w-8">
                        <Paperclip className="h-5 w-5 text-muted-foreground" />
                    </Button>
                </div>
                <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center">
                    <Button onClick={handleSend} disabled={(!file && !message.trim()) || isUploading} size="icon" className="h-8 w-8">
                        {isUploading && !file ? <Loader2 className="animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </div>
        </footer>
    );
}
