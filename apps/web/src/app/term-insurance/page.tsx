"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { calculateTermInsurance, getRecommendedCover } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";
import { useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceDot
} from "recharts";

const schema = z.object({
    age: z.number().min(18).max(65),
    annualIncome: z.number().min(300000).max(100000000),
    isSmoker: z.boolean(),
    coverAmount: z.number().min(100000).max(1000000000),
    policyTermYears: z.number().min(10).max(40),
    sipReturnRate: z.number().min(0.1).max(30),
    customSipAmount: z.number().optional(),
});

export default function TermInsurancePage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            age: 30,
            annualIncome: 1200000,
            isSmoker: false,
            coverAmount: 18000000, // Pre-filled example, will update automatically
            policyTermYears: 30,
            sipReturnRate: 12
        },
    });

    const vals = form.watch();

    // Auto-update cover amount when age or income changes, but allow user to override
    const { age, annualIncome } = vals;
    useEffect(() => {
        if (!form.formState.dirtyFields.coverAmount) {
            const recommended = getRecommendedCover(annualIncome, age);
            form.setValue('coverAmount', recommended, { shouldValidate: true });
        }
    }, [age, annualIncome, form]);

    const res = calculateTermInsurance({
        age: vals.age,
        annualIncome: vals.annualIncome,
        coverAmount: vals.coverAmount,
        isSmoker: vals.isSmoker,
        policyTermYears: vals.policyTermYears,
        sipReturnRate: vals.sipReturnRate,
        customSipAmount: vals.customSipAmount
    });

    return (
        <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left">
                <h1 className="text-3xl font-heading font-bold text-foreground">Term Insurance Evaluator</h1>
                <p className="text-muted-foreground mt-2">Discover the Zero Cost Strategy.</p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* ─── INPUT PANEL (6 FIELDS) ───────────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-1/3">
                    <Card className="glass-card border-brand-surfaceBorder sticky top-24">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Tell us about yourself</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <SliderInput
                                label="Your Age"
                                suffix="Yrs"
                                min={18} max={65} step={1}
                                value={vals.age}
                                onChange={(val) => form.setValue('age', val)}
                            />

                            <SliderInput
                                label="Annual Income"
                                symbol="₹"
                                min={300000} max={50000000} step={100000}
                                value={vals.annualIncome}
                                onChange={(val) => form.setValue('annualIncome', val)}
                            />

                            <div className="pt-2 border-t border-brand-surfaceBorder/50">
                                <label className="text-sm font-medium block mb-3">Smoker?</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => form.setValue('isSmoker', false)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all duration-200 ${!vals.isSmoker ? 'bg-foreground text-background shadow-md' : 'bg-brand-surface border border-brand-surfaceBorder text-muted-foreground hover:bg-brand-surface/80'}`}
                                    >
                                        No
                                    </button>
                                    <button
                                        onClick={() => form.setValue('isSmoker', true)}
                                        className={`flex-1 py-1.5 text-xs rounded-md transition-all duration-200 ${vals.isSmoker ? 'bg-foreground text-background shadow-md' : 'bg-brand-surface border border-brand-surfaceBorder text-muted-foreground hover:bg-brand-surface/80'}`}
                                    >
                                        Yes
                                    </button>
                                </div>
                            </div>

                            <SliderInput
                                label="Cover Amount"
                                symbol="₹"
                                min={1000000} max={100000000} step={500000}
                                value={vals.coverAmount}
                                onChange={(val) => form.setValue('coverAmount', val, { shouldDirty: true })}
                            />

                            <SliderInput
                                label="Policy Term"
                                suffix="years"
                                min={10} max={40} step={1}
                                value={vals.policyTermYears}
                                onChange={(val) => form.setValue('policyTermYears', val)}
                            />

                            <div className="pt-2 border-t border-brand-surfaceBorder/50">
                                <SliderInput
                                    label="Expected SIP Return"
                                    suffix="%"
                                    min={0.1} max={30} step={0.1}
                                    value={vals.sipReturnRate}
                                    onChange={(val) => form.setValue('sipReturnRate', val)}
                                />
                            </div>

                        </CardContent>
                    </Card>
                </motion.div>

                {/* ─── RESULTS PANEL (3 CARDS) ───────────────────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full lg:w-2/3 flex flex-col gap-6">

                    {/* CARD 1: YOUR PREMIUM */}
                    <Card className="glass-card border-brand-surfaceBorder overflow-hidden bg-brand-surface/30">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base font-medium text-muted-foreground">
                                For {formatCompactCurrency(vals.coverAmount)} cover over {vals.policyTermYears} years
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Monthly Premium</p>
                                    <p className="text-3xl font-heading font-bold text-foreground">
                                        {formatCurrency(res.monthlyPremium)}
                                    </p>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-brand-surfaceBorder"></div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Annual Premium</p>
                                    <p className="text-xl font-heading font-semibold text-foreground">
                                        {formatCurrency(res.annualPremium)}
                                    </p>
                                </div>
                                <div className="hidden sm:block w-px h-12 bg-brand-surfaceBorder"></div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                                    <p className="text-lg font-mono text-foreground">
                                        {formatCompactCurrency(res.totalPremiumsPaid)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CARD 2: THE WOW CARD */}
                    <motion.div
                        className="glass-card rounded-[20px] p-[2px] relative overflow-hidden group shadow-xl"
                    >
                        {/* Gold glowing border - subtle */}
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-gold/70 via-yellow-400/70 to-brand-gold/70 opacity-100 rounded-[20px] animate-[pulse_4s_ease-in-out_infinite]"></div>

                        <div className="relative bg-background/95 backdrop-blur-3xl rounded-[18px] p-6 md:p-8 text-center border-2 border-transparent flex flex-col items-center">

                            {vals.customSipAmount ? (
                                <p className="text-base text-foreground/80 font-medium mb-4">
                                    With your <span className="text-brand-gold font-bold">Custom SIP</span> of
                                </p>
                            ) : (
                                <p className="text-base text-foreground/80 font-medium mb-4">
                                    To get this insurance <span className="text-brand-gold font-bold uppercase tracking-wider">FREE</span>, invest just
                                </p>
                            )}

                            <div className="inline-block relative w-full max-w-sm">
                                {/* Subtle inner glow behind the number */}
                                <div className="absolute inset-0 bg-brand-gold/10 blur-xl rounded-full"></div>
                                <div className="relative border border-brand-gold/20 bg-brand-gold/5 px-6 py-4 rounded-3xl shadow-inner flex flex-col items-center justify-center gap-2">
                                    <AnimatePresence mode="popLayout">
                                        <motion.div
                                            key={res.actualMonthlySIP}
                                            initial={{ scale: 0.9, opacity: 0, y: 5 }}
                                            animate={{ scale: 1, opacity: 1, y: 0 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className="text-4xl md:text-5xl font-mono text-brand-gold font-bold tracking-tighter filter drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                                        >
                                            {formatCurrency(res.actualMonthlySIP)}<span className="text-xl md:text-2xl text-brand-gold/70 tracking-normal font-medium">/mo</span>
                                        </motion.div>
                                    </AnimatePresence>

                                    {/* Custom SIP Input Area */}
                                    <div className="mt-2 w-full flex items-center justify-center gap-2 border-t border-brand-gold/10 pt-3">
                                        <label className="text-xs text-muted-foreground whitespace-nowrap">Customize:</label>
                                        <input
                                            type="number"
                                            className="bg-background/50 border border-brand-surfaceBorder rounded px-3 py-1.5 text-sm w-24 focus:outline-none focus:border-brand-gold transition-colors text-foreground text-center"
                                            placeholder={`₹${res.requiredMonthlySIP}`}
                                            value={vals.customSipAmount || ''}
                                            onChange={(e) => {
                                                const val = e.target.value ? Number(e.target.value) : undefined;
                                                form.setValue('customSipAmount', val);
                                            }}
                                        />
                                        {vals.customSipAmount && (
                                            <button
                                                onClick={() => form.setValue('customSipAmount', undefined)}
                                                className="text-xs text-brand-gold/80 hover:text-brand-gold underline ml-1"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-sm text-foreground/70 font-medium mt-5 max-w-sm mx-auto leading-relaxed">
                                {vals.customSipAmount ? "extra in SIP alongside your premium." : "extra in SIP alongside your premium."}
                            </p>

                            <div className="mt-6 pt-5 border-t border-brand-gold/10 w-full">
                                {res.breakEvenYear > 0 ? (
                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                        Your SIP will return every rupee paid as premium at <span className="text-foreground font-semibold">Year {res.breakEvenYear}</span>.
                                    </p>
                                ) : (
                                    <p className="text-sm leading-relaxed text-brand-danger/80">
                                        Your SIP will not break even by the end of the term.
                                    </p>
                                )}
                            </div>

                        </div>
                    </motion.div>

                    {/* CARD 3: THE CHART */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardHeader>
                            <CardTitle className="text-xl">Zero Cost Timeline</CardTitle>
                            <CardDescription>When your SIP overtakes your total premiums paid</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={res.chartData} margin={{ top: 20, right: 20, left: 0, bottom: 25 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis
                                        dataKey="year"
                                        stroke="rgba(255,255,255,0.4)"
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                        label={{ value: 'Years', position: 'insideBottom', offset: -25, fill: 'rgba(255,255,255,0.4)', fontSize: 14 }}
                                    />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.4)"
                                        tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgb(24 24 27)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                                        itemStyle={{ fontSize: '14px', fontWeight: 500 }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '12px' }}
                                        formatter={(value: any, name: any) => [formatCurrency(value || 0), name === 'cumulativePremium' ? 'Total Premium Paid' : 'SIP Corpus']}
                                        labelFormatter={(label) => `Year ${label}`}
                                    />

                                    {/* Red Line - Linear growth */}
                                    <Line
                                        type="monotone"
                                        dataKey="cumulativePremium"
                                        name="cumulativePremium"
                                        stroke="#ef4444"
                                        strokeWidth={2}
                                        strokeDasharray="4 4"
                                        dot={false}
                                        activeDot={false}
                                    />

                                    {/* Gold Line - Exponential growth */}
                                    <Line
                                        type="monotone"
                                        dataKey="sipCorpus"
                                        name="sipCorpus"
                                        stroke="#eab308"
                                        strokeWidth={4}
                                        dot={false}
                                        activeDot={{ r: 8, fill: "#eab308", stroke: "rgba(255,255,255,0.8)", strokeWidth: 3 }}
                                    />

                                    {/* Crossover Marker */}
                                    {res.breakEvenYear > 0 && res.chartData[res.breakEvenYear - 1] && (
                                        <ReferenceDot
                                            x={res.breakEvenYear}
                                            y={res.chartData[res.breakEvenYear - 1].sipCorpus}
                                            r={6}
                                            fill="#eab308"
                                            stroke="white"
                                            strokeWidth={2}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <p className="text-xs text-center text-muted-foreground opacity-60 mt-4 px-4">
                        Disclaimer: Premium quotes are actuarial estimates based on standard IALM 2012-14 mortality tables. Actual premiums are determined by insurers after medical underwriting. Mutual fund investments are subject to market risks. This tool is for educational purposes only.
                    </p>

                </motion.div>
            </div>
        </div>
    );
}
