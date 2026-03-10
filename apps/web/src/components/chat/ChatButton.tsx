"use client";

import React, { Suspense, lazy, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const ChatPanel = lazy(() =>
    import("./ChatPanel").then((m) => ({ default: m.ChatPanel }))
);

export function ChatButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating trigger button */}
            <motion.button
                aria-label="Open WealthCraft AI Chat"
                onClick={() => setIsOpen((prev) => !prev)}
                className="fixed z-50 flex items-center justify-center rounded-full shadow-2xl cursor-pointer"
                style={{
                    bottom: 24,
                    right: 24,
                    width: 56,
                    height: 56,
                    background: "linear-gradient(135deg, #F5A623, #FF8C00)",
                    boxShadow: "0 8px 32px rgba(245, 166, 35, 0.45)",
                }}
                animate={{
                    scale: isOpen ? 1 : [1, 1.05, 1],
                    rotate: isOpen ? 15 : 0,
                }}
                transition={
                    isOpen
                        ? { duration: 0.2 }
                        : {
                            scale: {
                                repeat: Infinity,
                                duration: 3,
                                ease: "easeInOut",
                            },
                            rotate: { duration: 0.2 },
                        }
                }
                whileTap={{ scale: 0.92 }}
            >
                <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
            </motion.button>

            {/* Lazy-loaded chat panel */}
            <AnimatePresence>
                {isOpen && (
                    <Suspense fallback={null}>
                        <ChatPanel onClose={() => setIsOpen(false)} />
                    </Suspense>
                )}
            </AnimatePresence>
        </>
    );
}
