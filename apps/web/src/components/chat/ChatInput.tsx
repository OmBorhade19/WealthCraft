"use client";

import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";

interface ChatInputProps {
    value: string;
    onChange: (value: string) => void;
    onSend: () => void;
    isLoading: boolean;
    disabled?: boolean;
}

const MAX_CHARS = 500;
const COUNTER_THRESHOLD = 400;

export function ChatInput({
    value,
    onChange,
    onSend,
    isLoading,
    disabled,
}: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea up to 4 lines
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = "auto";
        const lineHeight = 22;
        const maxHeight = lineHeight * 4 + 24; // 4 lines + padding
        el.style.height = Math.min(el.scrollHeight, maxHeight) + "px";
    }, [value]);

    // Auto-focus when loading ends
    useEffect(() => {
        if (!isLoading) {
            textareaRef.current?.focus();
        }
    }, [isLoading]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (!isDisabled) onSend();
        }
    };

    const charsLeft = MAX_CHARS - value.length;
    const showCounter = value.length > COUNTER_THRESHOLD;
    const overLimit = value.length > MAX_CHARS;
    const isDisabled = disabled || isLoading || value.trim() === "" || overLimit;

    return (
        <div
            style={{
                background: "#FFFFFF",
                borderTop: "1px solid #F1F5F9",
                padding: "12px 12px 12px 14px",
            }}
        >
            <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading || !!disabled}
                        placeholder="Ask me anything about your finances..."
                        rows={1}
                        maxLength={MAX_CHARS + 1}
                        className="w-full resize-none outline-none text-sm leading-[22px]"
                        style={{
                            background: "transparent",
                            color: "#1E293B",
                            caretColor: "#F5A623",
                            lineHeight: "22px",
                            padding: "3px 0",
                            minHeight: 28,
                        }}
                    />
                    {showCounter && (
                        <span
                            className="absolute bottom-0 right-0 text-[10px] leading-none"
                            style={{ color: overLimit ? "#EF4444" : "#6B7280" }}
                        >
                            {charsLeft >= 0 ? charsLeft : `+${Math.abs(charsLeft)}`}
                        </span>
                    )}
                </div>

                <motion.button
                    onClick={onSend}
                    disabled={isDisabled}
                    aria-label="Send message"
                    className="shrink-0 flex items-center justify-center rounded-full cursor-pointer transition-opacity"
                    style={{
                        width: 36,
                        height: 36,
                        background: isDisabled ? "#374151" : "#F5A623",
                        opacity: isDisabled ? 0.5 : 1,
                    }}
                    whileTap={isDisabled ? {} : { scale: 0.9 }}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    ) : (
                        <Send
                            className="w-4 h-4"
                            style={{ color: isDisabled ? "#9CA3AF" : "#0F1623" }}
                        />
                    )}
                </motion.button>
            </div>
        </div>
    );
}
