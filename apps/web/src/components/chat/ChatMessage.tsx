"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    isError?: boolean;
}

interface ChatMessageProps {
    message: Message;
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

export function ChatMessage({ message }: ChatMessageProps) {
    const isUser = message.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, x: isUser ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}
        >
            {/* Bubble */}
            <div
                className={`flex items-start gap-1.5 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"
                    }`}
            >
                {/* AI Icon */}
                {!isUser && (
                    <div className="mt-1 shrink-0">
                        <Sparkles
                            className="w-3.5 h-3.5"
                            style={{ color: "#F5A623" }}
                            strokeWidth={2}
                        />
                    </div>
                )}

                <div
                    style={{
                        background: message.isError
                            ? "rgba(239,68,68,0.1)"
                            : isUser
                                ? "#F5A623"
                                : "#F1F5F9",
                        color: isUser ? "#FFFFFF" : "#1E293B",
                        borderRadius: isUser
                            ? "16px 16px 4px 16px"
                            : "16px 16px 16px 4px",
                        border: message.isError
                            ? "1px solid rgba(239,68,68,0.2)"
                            : isUser
                                ? "none"
                                : "1px solid #E2E8F0",
                        fontSize: 14,
                        lineHeight: 1.55,
                        padding: "10px 14px",
                        width: "fit-content",
                        minWidth: "50px",
                        flexShrink: 0,
                    }}
                >
                    {isUser ? (
                        <span>{message.content}</span>
                    ) : (
                        <div className="prose-chat">
                            <ReactMarkdown
                                components={{
                                    p: ({ children }) => (
                                        <p className="mb-1.5 last:mb-0">{children}</p>
                                    ),
                                    strong: ({ children }) => (
                                        <strong style={{ color: "#F5A623", fontWeight: 600 }}>
                                            {children}
                                        </strong>
                                    ),
                                    ul: ({ children }) => (
                                        <ul className="list-disc pl-4 mb-1.5 space-y-0.5">
                                            {children}
                                        </ul>
                                    ),
                                    ol: ({ children }) => (
                                        <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">
                                            {children}
                                        </ol>
                                    ),
                                    li: ({ children }) => (
                                        <li className="text-sm">{children}</li>
                                    ),
                                    code: ({ children }) => (
                                        <code
                                            style={{
                                                background: "rgba(245,166,35,0.15)",
                                                color: "#F5A623",
                                                borderRadius: 4,
                                                padding: "1px 5px",
                                                fontSize: 12,
                                                fontFamily: "JetBrains Mono, monospace",
                                            }}
                                        >
                                            {children}
                                        </code>
                                    ),
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>
            </div>

            {/* Timestamp */}
            <span
                className="text-[10px] px-1"
                style={{ color: "#4B5563", lineHeight: 1 }}
            >
                {formatTime(message.timestamp)}
            </span>
        </motion.div>
    );
}
