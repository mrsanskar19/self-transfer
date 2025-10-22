
"use client";

import { useEffect, useRef } from "react";
import { Message, User } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
    messages: Message[];
    currentUser: User | null;
    currentDeviceIp: string | undefined;
}

export function MessageList({ messages, currentUser, currentDeviceIp }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    if (!currentUser) return null;

    const sortedMessages = messages.sort((a,b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());

    return (
        <div className="space-y-4">
            {sortedMessages.map(msg => (
                <MessageBubble 
                    key={msg.id} 
                    message={msg} 
                    isOwnMessage={msg.deviceInfo?.ip === currentDeviceIp} 
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}
