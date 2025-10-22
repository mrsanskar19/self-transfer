
"use client";

import { useEffect, useRef } from "react";
import { Message, User } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
    messages: Message[];
    currentUser: User;
}

export function MessageList({ messages, currentUser }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="space-y-4">
            {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.userId === currentUser.username} />
            ))}
            <div ref={messagesEndRef} />
        </div>
    )
}
