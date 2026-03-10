"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const CHIPS = [
    "How much SIP do I need for ₹1 Crore?",
    "Should I choose old or new tax regime?",
    "Explain term insurance simply",
    "What is SWP and how does it work?",
];

interface SuggestionChipsProps {
    onSelect: (text: string) => void;
}

export function SuggestionChips({ onSelect }: SuggestionChipsProps) {
    return (
        <div className="flex flex-col items-center gap-5 px-4 py-6">
            {/* Welcome heading */}
            <div className="flex flex-col items-center gap-3 text-center">
                <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{
                        width: 64,
                        height: 64,
                        background: "rgba(245,166,35,0.12)",
                        border: "1px solid rgba(245,166,35,0.3)",
                    }}
                >
                    <Sparkles
                        className="w-8 h-8"
                        style={{ color: "#F5A623" }}
                        strokeWidth={1.5}
                    />
                </div>
                <div>
                    <h3
                        className="font-heading font-bold text-lg"
                        style={{ color: "#1E293B" }}
                    >
                        Hi! I&apos;m WealthCraft AI
                    </h3>
                    <p className="text-sm mt-1" style={{ color: "#64748B" }}>
                        Ask me about SIP, taxes, insurance, home loans,
                        <br />
                        or any financial question
                    </p>
                </div>
            </div>

            {/* Suggestion chips */}
            <div className="flex flex-col gap-2 w-full">
                {CHIPS.map((chip, i) => (
                    <motion.button
                        key={chip}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.22, ease: "easeOut" }}
                        onClick={() => onSelect(chip)}
                        className="text-left text-sm px-3.5 py-2.5 rounded-xl transition-all duration-150 cursor-pointer"
                        style={{
                            background: "#F1F5F9",
                            border: "1px solid #E2E8F0",
                            color: "#1E293B",
                        }}
                        whileHover={{
                            background: "rgba(245,166,35,0.1)",
                            borderColor: "#F5A623",
                            scale: 1.01,
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {chip}
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
