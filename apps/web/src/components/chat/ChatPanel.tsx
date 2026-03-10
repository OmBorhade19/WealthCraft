"use client";

import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useId,
} from "react";
import { motion } from "framer-motion";
import { Sparkles, X, ChevronDown } from "lucide-react";
import { ChatMessage, Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestionChips } from "./SuggestionChips";
import { AnimatePresence } from "framer-motion";

interface ChatPanelProps {
    onClose: () => void;
}

export function ChatPanel({ onClose }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messageListRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const firstFocusableRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelId = useId();
    const originalTitle = useRef<string>("");

    // Focus trap & Escape key
    useEffect(() => {
        originalTitle.current = document.title;
        // Initial focus on input instead of close button
        const initialFocusTimeout = setTimeout(() => {
            const input = panelRef.current?.querySelector("textarea");
            input?.focus();
        }, 300); // Wait for open animation

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
                return;
            }
            // Focus trap
            if (e.key === "Tab" && panelRef.current) {
                const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        // Prevent body scroll on mobile
        const isMobile = window.innerWidth < 768;
        if (isMobile) document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
            document.title = originalTitle.current;
        };
    }, [onClose]);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        const el = messageListRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [messages, isLoading]);

    const sendMessage = useCallback(
        async (text: string) => {
            const userText = text.trim();
            if (!userText || isLoading) return;

            const userMessage: Message = {
                id: crypto.randomUUID(),
                role: "user",
                content: userText,
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInputValue("");
            setIsLoading(true);
            document.title = "WealthCraft AI is typing…";

            // Build OpenAI-format history (last 10 messages, no system prompt — route adds it)
            const history = messages.slice(-10).map((m) => ({
                role: m.role === "user" ? "user" : "assistant",
                content: m.content,
            }));

            // Add current user message
            const openAIMessages = [
                ...history,
                { role: "user", content: userText },
            ];

            console.log("Sending to /api/chat:", openAIMessages);

            try {
                const res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ messages: openAIMessages }),
                });

                const data = await res.json().catch(() => ({}));
                console.log("Received from /api/chat:", data);

                if (!res.ok) {
                    const errText =
                        data?.error ||
                        (res.status === 429
                            ? "I'm getting a lot of questions right now. Please wait a moment and try again."
                            : "Sorry, I couldn't connect. Please try again.");
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: crypto.randomUUID(),
                            role: "assistant" as const,
                            content: errText,
                            timestamp: new Date(),
                            isError: true,
                        },
                    ]);
                    return;
                }

                const reply = data?.reply;
                if (!reply) {
                    throw new Error("Empty reply from server");
                }

                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant" as const,
                        content: reply,
                        timestamp: new Date(),
                    },
                ]);
            } catch (err: unknown) {
                console.error("Chat fetch error:", err);
                setMessages((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        role: "assistant" as const,
                        content: "Sorry, I couldn't connect. Please try again.",
                        timestamp: new Date(),
                        isError: true,
                    },
                ]);
            } finally {
                setIsLoading(false);
                document.title = originalTitle.current;
            }
        },
        [messages, isLoading]
    );


    const handleChipSelect = useCallback(
        (text: string) => {
            sendMessage(text);
        },
        [sendMessage]
    );

    return (
        <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="WealthCraft AI Chat"
            aria-modal="true"
            id={panelId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed z-50"
            style={{
                // Desktop: floating panel
                bottom: 90,
                right: 24,
                width: "min(420px, calc(100vw - 48px))",
                // Mobile: full screen
            }}
        >
            {/* Responsive wrapper: full-screen on mobile */}
            <style>{`
        @media (max-width: 767px) {
          #${CSS.escape(panelId)} {
            bottom: 0 !important;
            right: 0 !important;
            width: 100vw !important;
            height: 100dvh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

            <div
                style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderTop: "2px solid #F5A623",
                    borderRadius: 16,
                    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.1)",
                    display: "flex",
                    flexDirection: "column",
                    height: 580,
                    overflow: "hidden",
                }}
            >
                {/* ── Header ─────────────────────────────────── */}
                <div
                    style={{
                        background: "#F8FAFC",
                        borderBottom: "1px solid #F1F5F9",
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        flexShrink: 0,
                    }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex items-center justify-center rounded-lg"
                            style={{
                                width: 34,
                                height: 34,
                                background: "rgba(245,166,35,0.15)",
                                border: "1px solid rgba(245,166,35,0.3)",
                            }}
                        >
                            <Sparkles
                                className="w-4 h-4"
                                style={{ color: "#F5A623" }}
                                strokeWidth={2}
                            />
                        </div>
                        <div>
                            <p
                                className="font-heading font-bold text-sm leading-tight"
                                style={{ color: "#1E293B" }}
                            >
                                WealthCraft AI
                            </p>
                            <p className="text-[11px] leading-tight" style={{ color: "#64748B" }}>
                                Your personal finance advisor
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            ref={firstFocusableRef}
                            onClick={onClose}
                            aria-label="Minimize chat"
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                            style={{ color: "#6B7280" }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#F1F5F9")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                            }
                        >
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                            onClick={onClose}
                            aria-label="Close chat"
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer"
                            style={{ color: "#6B7280" }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "#1E2D45")
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                            }
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* ── Messages area ───────────────────────────── */}
                <div
                    ref={messageListRef}
                    className="flex-1 overflow-y-auto"
                    style={{
                        padding: "16px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        // Custom scrollbar
                        scrollbarWidth: "thin",
                        scrollbarColor: "#F5A623 transparent",
                    }}
                >
                    {messages.length === 0 && !isLoading ? (
                        <SuggestionChips onSelect={handleChipSelect} />
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <ChatMessage key={msg.id} message={msg} />
                            ))}
                            <AnimatePresence>
                                {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                                    <TypingIndicator />
                                )}
                            </AnimatePresence>
                        </>
                    )}
                    {/* Spacer so last message is never hidden behind input */}
                    <div style={{ height: 4 }} />
                </div>

                {/* ── Input area ──────────────────────────────── */}
                <div style={{ flexShrink: 0 }}>
                    <ChatInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSend={() => sendMessage(inputValue)}
                        isLoading={isLoading}
                    />
                </div>
            </div>
        </motion.div>
    );
}
