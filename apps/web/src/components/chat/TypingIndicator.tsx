"use client";

import React from "react";
import { motion } from "framer-motion";

export function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-1.5"
        >
            <div
                style={{
                    background: "#F1F5F9",
                    border: "1px solid #E2E8F0",
                    borderRadius: "16px 16px 16px 4px",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                }}
            >
                {[0, 1, 2].map((i) => (
                    <motion.span
                        key={i}
                        style={{
                            display: "block",
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "#F5A623",
                        }}
                        animate={{
                            y: [0, -6, 0],
                            opacity: [0.4, 1, 0.4],
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.18,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );
}
