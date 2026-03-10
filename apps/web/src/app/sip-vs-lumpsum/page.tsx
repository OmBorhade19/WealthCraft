"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { compareSIPvsLumpsum } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { ComparisonChart } from "@/components/charts/ComparisonChart";
import { Card, CardContent } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";

const schema = z.object({
    totalAmount: z.number().min(12000).max(100000000),
    annualReturnRate: z.number().min(0.1).max(50),
    timePeriodYears: z.number().min(1).max(50),
});

export default function SIPVsLumpsumPage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: { totalAmount: 1200000, annualReturnRate: 12, timePeriodYears: 10 },
    });

    const vals = form.watch();
    const res = compareSIPvsLumpsum(vals.totalAmount as any, vals.timePeriodYears as any, vals.annualReturnRate as any);

    const chartData = [
        { name: res.option1Name, value: res.option1Value, color: "#3B82F6" },
        { name: res.option2Name, value: res.option2Value, color: "#F5A623" }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">SIP vs Lumpsum</h1>
                <p className="text-muted-foreground mt-2">See how staggered investments fare against one-time deployments.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col - Inputs */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <SliderInput
                                    label="Total Capital to Deploy"
                                    symbol="₹"
                                    min={12000} max={20000000} step={10000}
                                    value={vals.totalAmount}
                                    onChange={(val) => form.setValue('totalAmount', val)}
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    For SIP, this translates to ₹{Math.round(vals.totalAmount / (vals.timePeriodYears * 12)).toLocaleString('en-IN')}/mo
                                </p>
                            </div>

                            <SliderInput
                                label="Expected Return Rate"
                                suffix="%"
                                min={0.1} max={30} step={0.1}
                                value={vals.annualReturnRate}
                                onChange={(val) => form.setValue('annualReturnRate', val)}
                            />

                            <SliderInput
                                label="Time Period (Years)"
                                suffix="Yrs"
                                min={1} max={40} step={1}
                                value={vals.timePeriodYears}
                                onChange={(val) => form.setValue('timePeriodYears', val)}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Col - Results */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-6">
                    <div className="glass-card rounded-xl p-6 border border-brand-surfaceBorder relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="absolute inset-0 bg-gold-gradient opacity-5 mix-blend-overlay" />
                        <div className="relative z-10 text-center md:text-left">
                            <p className="text-sm text-brand-gold font-medium uppercase tracking-wider mb-2">Mathematical Winner</p>
                            <h2 className="text-4xl font-heading font-bold text-foreground">{res.winner}</h2>
                            <p className="text-muted-foreground mt-2">
                                Outperforms by <span className="font-mono text-brand-success font-medium">{formatCurrency(res.difference)}</span>
                            </p>
                        </div>

                        <div className="relative z-10 flex gap-4">
                            <div className="bg-brand-darkBg/50 backdrop-blur-sm border border-brand-surfaceBorder rounded-lg p-4 min-w-[140px] text-center">
                                <p className="text-xs text-muted-foreground mb-1">SIP Final Value</p>
                                <p className="font-mono font-bold text-brand-blue">{formatCompactCurrency(res.option1Value)}</p>
                            </div>
                            <div className="bg-brand-darkBg/50 backdrop-blur-sm border border-brand-surfaceBorder rounded-lg p-4 min-w-[140px] text-center border-b-2 border-b-brand-gold">
                                <p className="text-xs text-muted-foreground mb-1">Lumpsum Final Value</p>
                                <p className="font-mono font-bold text-brand-gold">{formatCompactCurrency(res.option2Value)}</p>
                            </div>
                        </div>
                    </div>

                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6">
                            <h3 className="font-heading font-semibold mb-6 flex items-center gap-2 text-foreground">
                                <span className="w-2 h-2 rounded-full bg-brand-gold" />
                                Final Value Comparison
                            </h3>
                            <ComparisonChart data={chartData} />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
