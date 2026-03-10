import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are WealthCraft AI, an expert Indian personal finance advisor. Your expertise covers mutual funds, SIP, income tax (old and new regime FY 2025-26), term insurance, SWP, home loans, EMI, networth tracking, and capital gains tax. Always use Indian context — rupees, SEBI regulations, RBI guidelines. Format answers with bullet points and bold key numbers. Add a disclaimer for specific financial advice. For non-finance questions, politely redirect back to finance topics.`;

export async function POST(request: NextRequest) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey || apiKey === "your_api_key_here") {
        return NextResponse.json(
            { error: "Gemini API key is not configured." },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { messages } = body as {
            messages: { role: "user" | "assistant"; content: string }[];
        };

        const ai = new GoogleGenAI({ apiKey });

        // Map OpenAI format to Gemini format
        const contents = (messages || []).map((m) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
        }));

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: SYSTEM_PROMPT,
            },
            contents,
        });

        const reply = result.text;
        if (!reply) {
            return NextResponse.json({ error: "Empty response from Gemini" }, { status: 500 });
        }

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error("Gemini API error:", error);

        const message = error.message || "Internal server error";

        if (message.includes("429") || message.toLowerCase().includes("quota")) {
            return NextResponse.json(
                { error: "I'm getting a lot of questions right now. Please wait a moment and try again." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
