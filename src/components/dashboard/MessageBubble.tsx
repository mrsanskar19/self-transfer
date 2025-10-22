
"use client";

import { useState } from "react";
import Image from "next/image";
import { Message } from "@/lib/types";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { Loader2, Trash2, Shield, Copy, MessageSquareText, File as FileIcon, Download, Check, CheckCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";

interface MessageBubbleProps {
    message: Message;
    isOwnMessage: boolean;
}

const getInitials = (name: string) => name?.[0]?.toUpperCase() ?? 'U';

const renderMessageContent = (msg: Message, onDownload: () => void) => {
    if (msg.type === 'file' && msg.name?.match(/\.(jpeg|jpg|gif|png)$/)) {
        return <FileDisplay message={msg} onDownload={onDownload} isImage={true} />;
    }
    if (msg.type === 'file') {
        return <FileDisplay message={msg} onDownload={onDownload} isImage={false} />;
    }
    return <p className="text-sm">{msg.content}</p>;
};

const FileDisplay = ({ message, onDownload, isImage }: { message: Message, onDownload: () => void, isImage: boolean }) => (
    <div className="flex items-center gap-3 bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
        {isImage ? <FileIcon className="h-6 w-6 flex-shrink-0 text-primary-foreground/80" /> : <FileIcon className="h-6 w-6 flex-shrink-0" />}
        <p className="font-medium truncate" title={message.name}>{message.name}</p>
        <Button onClick={onDownload} variant="ghost" size="icon" className="h-7 w-7 text-primary-foreground/80 hover:text-primary-foreground">
            <Download size={16} />
        </Button>
    </div>
);

export function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { toast } = useToast();

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
    
    const handleDownload = async () => {
        // Fetch full message data including the URL
        const res = await fetch(`/api/messages/${message.id}`);
        if (!res.ok) {
            toast({ title: "Error", description: "Could not retrieve file for download.", variant: "destructive" });
            return;
        }
        const fullMessage: Message = await res.json();
        
        if (!fullMessage.url || !fullMessage.name) return;

        const link = document.createElement('a');
        link.href = fullMessage.url;
        link.setAttribute('download', fullMessage.name);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        
        toast({ title: "Downloaded", description: "File has been deleted from the vault." });
        await fetch(`/api/messages/${message.id}`, { method: 'DELETE' });
    }

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

    if (isOwnMessage) {
        return (
            <>
                <div className="flex justify-end items-start gap-3 mb-4">
                    <div className="flex flex-col items-end gap-1 max-w-xs lg:max-w-md">
                        <div className="p-3 rounded-2xl rounded-br-none bg-primary text-primary-foreground">
                            {renderMessageContent(message, handleDownload)}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                             {message.seen ? <CheckCheck size={14} className="text-blue-500" /> : <Check size={14} />}
                            {message.deviceInfo && (
                                <div className="flex items-center gap-1.5" title={`${message.deviceInfo.userAgent} (IP: ${message.deviceInfo.ip})`}>
                                    <Shield size={12} />
                                    <span>From your device</span>
                                </div>
                            )}
                            {(message.type === 'text' || message.shareableUrl) && (
                                <Button onClick={() => handleDelete(message.id)} variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10" disabled={deletingId === message.id}>
                                    {deletingId === message.id ? <Loader2 className="animate-spin" size={12} /> : <Trash2 size={12} />}
                                </Button>
                            )}
                        </div>
                    </div>
                    <Avatar className="h-8 w-8">
                        <AvatarFallback>{getInitials(message.userId)}</AvatarFallback>
                    </Avatar>
                </div>
                 {/* Vault's Reply */}
                 {message.type === 'file' && message.shareableUrl && (
                    <div className="flex justify-start items-end gap-3 mb-4">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback><Shield className="h-4 w-4" /></AvatarFallback>
                        </Avatar>
                        <div className="max-w-xs lg:max-w-md space-y-2">
                            <Card className="bg-background dark:bg-muted">
                                <CardContent className="p-3 space-y-3">
                                    <div>
                                        <p className="font-semibold text-sm mb-1">File Secured!</p>
                                        <p className="text-xs text-muted-foreground">
                                            Link expires at: {new Date(new Date(message.uploadedAt).getTime() + 60 * 60 * 1000).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Input id={`share-link-${message.id}`} type="text" readOnly value={message.shareableUrl} className="bg-background h-9 text-xs" />
                                        <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(message.shareableUrl!)} title="Copy Link" className="h-9 w-9">
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="icon" onClick={() => handleShareViaText(message.shareableUrl!)} title="Share via Text" className="h-9 w-9">
                                            <MessageSquareText className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                 )}
            </>
        );
    }

    return (
        <div className="flex justify-start items-start gap-3 mb-4">
            <Avatar className="h-8 w-8">
                <AvatarFallback>{getInitials(message.userId)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start gap-1 max-w-xs lg:max-w-md">
                <div className="p-3 rounded-2xl rounded-bl-none bg-background dark:bg-muted">
                    {renderMessageContent(message, handleDownload)}
                </div>
                {message.deviceInfo && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5" title={`${message.deviceInfo.userAgent} (IP: ${message.deviceInfo.ip})`}>
                        <Shield size={12} />
                        <span>From {message.userId}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
