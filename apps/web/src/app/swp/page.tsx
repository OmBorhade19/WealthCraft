"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { calculateSWP } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ReferenceDot
} from "recharts";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";

const schema = z.object({
    corpus: z.number().min(100000).max(1000000000),
    monthlyWithdrawal: z.number().min(1000).max(10000000),
    annualReturnRate: z.number().min(0.1).max(50),
    tenureYears: z.number().min(1).max(50),
});

export default function SWPPage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            // @ts-ignore - allowing empty default for untouched UX
            corpus: undefined,
            // @ts-ignore
            monthlyWithdrawal: undefined,
            // @ts-ignore
            annualReturnRate: undefined,
            tenureYears: 20
        },
    });

    const vals = form.watch();
    const isValid = form.formState.isValid;

    // Use a safe fallback for the initial engine run so the page doesn't crash before inputs are filled
    const res = isValid ? calculateSWP({
        initialCorpus: vals.corpus || 0,
        monthlyWithdrawal: vals.monthlyWithdrawal || 0,
        annualReturnRate: vals.annualReturnRate || 0,
        tenureYears: vals.tenureYears || 20
    }) : null;

    const [showMonthly, setShowMonthly] = useState(false);
    const [monthlyPage, setMonthlyPage] = useState(1);
    const rowsPerPage = 24;

    const currentMonthlyData = res?.monthlyBreakdown.slice(
        (monthlyPage - 1) * rowsPerPage,
        monthlyPage * rowsPerPage
    ) || [];

    const totalPages = res ? Math.ceil(res.monthlyBreakdown.length / rowsPerPage) : 0;

    const simulatedMonthlyRate = vals.annualReturnRate ? Math.pow(1 + vals.annualReturnRate / 100, 1 / 12) - 1 : 0;
    const simulatedMonthlyReturn = res ? (vals.corpus || 0) * simulatedMonthlyRate : 0;
    const isSelfSustaining = (vals.monthlyWithdrawal || 0) < simulatedMonthlyReturn;
    const isBreakEven = Math.abs((vals.monthlyWithdrawal || 0) - simulatedMonthlyReturn) / simulatedMonthlyReturn < 0.05;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 pb-20">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center md:text-left">
                <h1 className="text-3xl font-heading font-bold text-foreground">SWP Calculator</h1>
                <p className="text-muted-foreground mt-2">Design a self-sustaining Systematic Withdrawal Plan.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ─── LEFT COLUMN: INPUTS ────────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
                    <Card className="glass-card border-brand-surfaceBorder sticky top-24">
                        <CardContent className="pt-6 space-y-6">

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Total Corpus</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="e.g. 50,00,000"
                                        className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md pl-8 pr-4 py-2 text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                                        value={vals.corpus ? new Intl.NumberFormat('en-IN').format(vals.corpus) : ''}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            const val = rawValue ? Number(rawValue) : undefined;
                                            form.setValue('corpus', val as number, { shouldValidate: true });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Monthly Withdrawal</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="e.g. 20,000"
                                        className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md pl-8 pr-4 py-2 text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                                        value={vals.monthlyWithdrawal ? new Intl.NumberFormat('en-IN').format(vals.monthlyWithdrawal) : ''}
                                        onChange={(e) => {
                                            const rawValue = e.target.value.replace(/[^0-9]/g, '');
                                            const val = rawValue ? Number(rawValue) : undefined;
                                            form.setValue('monthlyWithdrawal', val as number, { shouldValidate: true });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expected Annual Return</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 12"
                                        className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md px-4 py-2 pr-8 text-foreground focus:outline-none focus:border-brand-gold transition-colors"
                                        value={vals.annualReturnRate || ''}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : undefined;
                                            form.setValue('annualReturnRate', val as number, { shouldValidate: true });
                                        }}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                                </div>
                            </div>

                            <SliderInput
                                label="Tenure"
                                suffix="Years"
                                min={1} max={40} step={1}
                                value={vals.tenureYears || 20}
                                onChange={(val) => form.setValue('tenureYears', val as number, { shouldValidate: true })}
                            />

                        </CardContent>
                    </Card>
                </motion.div>

                {/* ─── RIGHT COLUMN: RESULTS ──────────────────────────────────────── */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 flex flex-col gap-6">

                    {(!isValid || !res) ? (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-brand-surfaceBorder rounded-xl p-12 text-center text-muted-foreground">
                            Please fill out all input fields to see your systematic withdrawal projection.
                        </div>
                    ) : (
                        <>
                            {/* CORPUS HEALTH INDICATOR */}
                            {res.isCorpusDepletedBeforeTenure ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl p-4 border bg-brand-danger/10 border-brand-danger/30 text-brand-danger"
                                >
                                    <div>
                                        <p className="font-medium text-sm md:text-base mb-1">
                                            ⚠ Your corpus depletes in Year {res.depletionYear} (Month {res.depletionMonth}).
                                        </p>
                                        <p className="text-xs md:text-sm opacity-80">
                                            To last {vals.tenureYears} years, reduce monthly withdrawal to ₹{Math.round(simulatedMonthlyReturn)} or less (your monthly return amount).
                                        </p>
                                    </div>
                                </motion.div>
                            ) : isBreakEven ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl p-4 border bg-amber-500/10 border-amber-500/30 text-amber-500"
                                >
                                    <p className="font-medium text-sm md:text-base">⚠ Your corpus is at break-even. Any market dip may deplete it faster.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-xl p-4 border bg-brand-success/10 border-brand-success/30 text-brand-success"
                                >
                                    <p className="font-medium text-sm md:text-base">✅ Your corpus is self-sustaining. It earns more than you withdraw each month.</p>
                                </motion.div>
                            )}

                            {/* 3 SUMMARY CARDS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card className="glass-card border-brand-surfaceBorder/60 bg-brand-surface/20">
                                    <CardContent className="p-4 md:p-5">
                                        <p className="text-xs text-muted-foreground mb-1">Total Corpus Invested</p>
                                        <p className="text-lg md:text-xl font-bold font-mono text-brand-gold">{formatCompactCurrency(res.totalInvested)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-brand-surfaceBorder/60 bg-brand-surface/20">
                                    <CardContent className="p-4 md:p-5">
                                        <p className="text-xs text-muted-foreground mb-1">Total Withdrawn</p>
                                        <p className="text-lg md:text-xl font-bold font-mono text-brand-blue">{formatCompactCurrency(res.totalWithdrawn)}</p>
                                    </CardContent>
                                </Card>
                                <Card className="glass-card border-brand-surfaceBorder/60 bg-brand-surface/20">
                                    <CardContent className="p-4 md:p-5">
                                        <p className="text-xs text-muted-foreground mb-1">Final Remaining</p>
                                        <p className={`text-lg md:text-xl font-bold font-mono ${res.finalCorpus > 0 ? 'text-brand-success' : 'text-brand-danger'}`}>{formatCompactCurrency(res.finalCorpus)}</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* AREACHART */}
                            <Card className="glass-card border-brand-surfaceBorder overflow-hidden">
                                <div className="p-6 pb-2">
                                    <h3 className="font-heading font-semibold text-foreground">Corpus Projection</h3>
                                </div>
                                <div className="h-[350px] w-full px-2 pb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={res.yearlyBreakdown} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                                            <defs>
                                                <linearGradient id="colorCorpus" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
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
                                                tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                                                axisLine={false}
                                                tickLine={false}
                                                dx={-10}
                                                domain={['auto', 'auto']}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'rgb(24 24 27)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ fontSize: '14px', fontWeight: 500, color: '#eab308' }}
                                                labelStyle={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px', fontSize: '12px' }}
                                                formatter={(value: any) => [formatCurrency(value || 0), 'Corpus Available']}
                                                labelFormatter={(label) => `End of Year ${label}`}
                                            />
                                            <ReferenceLine y={res.totalInvested} stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
                                            <Area
                                                type="monotone"
                                                dataKey="closingCorpus"
                                                stroke="#eab308"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorCorpus)"
                                            />
                                            {res.isCorpusDepletedBeforeTenure && res.depletionYear && (
                                                <ReferenceDot
                                                    x={res.depletionYear}
                                                    y={0}
                                                    r={6}
                                                    fill="red"
                                                    label={{ value: "Depleted", position: "top", fill: "red" }}
                                                />
                                            )}
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            {/* YEARLY BREAKDOWN TABLE */}
                            <Card className="glass-card border-brand-surfaceBorder overflow-hidden">
                                <div className="p-6 border-b border-brand-surfaceBorder/50">
                                    <h3 className="font-heading font-semibold text-foreground">Yearly Breakdown</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-brand-surface/40 border-b border-brand-surfaceBorder">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">Year</th>
                                                <th className="px-6 py-4 font-medium text-right">Opening Corpus</th>
                                                <th className="px-6 py-4 font-medium text-right text-brand-success">Returns Earned</th>
                                                <th className="px-6 py-4 font-medium text-right text-brand-blue">Withdrawn</th>
                                                <th className="px-6 py-4 font-medium text-right">Closing Corpus</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-brand-surfaceBorder/30">
                                            {res.yearlyBreakdown.map((row) => {
                                                const isDangerZone = row.closingCorpus < (res.totalInvested * 0.2) && row.closingCorpus > 0;
                                                const isDepleted = row.closingCorpus <= 0;

                                                return (
                                                    <tr key={row.year} className={`hover:bg-brand-surface/20 transition-colors ${isDangerZone ? 'bg-brand-danger/5' : ''} ${isDepleted ? 'bg-brand-danger/10 text-brand-danger/90' : ''}`}>
                                                        <td className="px-6 py-4 font-medium">Year {row.year}</td>
                                                        <td className="px-6 py-4 text-right font-mono">{formatCurrency(row.openingCorpus)}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-brand-success/90">+{formatCurrency(row.returnEarned)}</td>
                                                        <td className="px-6 py-4 text-right font-mono text-brand-blue/90">-{formatCurrency(row.totalWithdrawn)}</td>
                                                        <td className={`px-6 py-4 text-right font-mono font-bold ${isDangerZone ? 'text-brand-danger' : ''} ${isDepleted ? 'text-brand-danger' : 'text-brand-gold'}`}>
                                                            {formatCurrency(row.closingCorpus)}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* TOGGLE & MONTHLY BREAKDOWN */}
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={() => setShowMonthly(!showMonthly)}
                                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-brand-surface border border-brand-surfaceBorder text-sm font-medium hover:bg-brand-surface/80 transition-colors focus:outline-none"
                                >
                                    {showMonthly ? (
                                        <><ChevronUp className="w-4 h-4" /> Hide month-by-month breakdown</>
                                    ) : (
                                        <><ChevronDown className="w-4 h-4" /> Show month-by-month breakdown</>
                                    )}
                                </button>
                            </div>

                            <AnimatePresence>
                                {showMonthly && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <Card className="glass-card border-brand-surfaceBorder overflow-hidden mt-4">
                                            <div className="p-4 border-b border-brand-surfaceBorder/50 flex justify-between items-center bg-brand-surface/20">
                                                <h3 className="font-heading font-semibold text-foreground text-sm">Monthly Schedule</h3>

                                                {/* Pagination Controls */}
                                                <div className="flex items-center gap-4 text-xs">
                                                    <button
                                                        onClick={() => setMonthlyPage(p => Math.max(1, p - 1))}
                                                        disabled={monthlyPage === 1}
                                                        className="p-1.5 rounded-md hover:bg-brand-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                    <span className="text-muted-foreground font-mono">Page {monthlyPage} of {totalPages}</span>
                                                    <button
                                                        onClick={() => setMonthlyPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={monthlyPage === totalPages}
                                                        className="p-1.5 rounded-md hover:bg-brand-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="text-[10px] text-muted-foreground uppercase bg-brand-surface/40 border-b border-brand-surfaceBorder">
                                                        <tr>
                                                            <th className="px-4 py-3 font-medium">Month</th>
                                                            <th className="px-4 py-3 font-medium text-right">Opening</th>
                                                            <th className="px-4 py-3 font-medium text-right">+ Return</th>
                                                            <th className="px-4 py-3 font-medium text-right">- Withdrawal</th>
                                                            <th className="px-4 py-3 font-medium text-right">Closing</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-brand-surfaceBorder/30">
                                                        {currentMonthlyData.map((row) => (
                                                            <tr key={row.month} className={`hover:bg-brand-surface/20 transition-colors ${row.isLastMonth ? 'bg-brand-danger/10 text-brand-danger' : ''}`}>
                                                                <td className="px-4 py-3 font-medium opacity-80">M{row.month} (Yr {row.year})</td>
                                                                <td className="px-4 py-3 text-right font-mono opacity-80">{formatCurrency(row.openingCorpus)}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-brand-success/80">+{formatCurrency(row.returnEarned)}</td>
                                                                <td className="px-4 py-3 text-right font-mono text-brand-blue/80">-{formatCurrency(row.withdrawal)}</td>
                                                                <td className="px-4 py-3 text-right font-mono font-medium">{formatCurrency(row.closingCorpus)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </Card>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
