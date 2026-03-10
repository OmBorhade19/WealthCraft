"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { compareSIPvsFD } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { ComparisonChart } from "@/components/charts/ComparisonChart";
import { Card, CardContent } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";

const schema = z.object({
    monthlyInvestment: z.number().min(500).max(1000000),
    sipReturnRate: z.number().min(0.1).max(30),
    fdInterestRate: z.number().min(0.1).max(15),
    timePeriodYears: z.number().min(1).max(40),
});

export default function SIPVsFDPage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            monthlyInvestment: 25000,
            sipReturnRate: 12,
            fdInterestRate: 7,
            timePeriodYears: 10
        },
    });

    const vals = form.watch();
    const res = compareSIPvsFD(Number(vals.monthlyInvestment), Number(vals.timePeriodYears), Number(vals.sipReturnRate), Number(vals.fdInterestRate));

    const chartData = [
        { name: res.option1Name, value: res.option1Value, color: "#3B82F6" },
        { name: res.option2Name, value: res.option2Value, color: "#8B5CF6" }
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">SIP vs FD / RD</h1>
                <p className="text-muted-foreground mt-2">See the true opportunity cost of settling for fixed returns over long periods.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col - Inputs */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6 space-y-6">
                            <SliderInput
                                label="Monthly Investment"
                                symbol="₹"
                                min={500} max={500000} step={500}
                                value={vals.monthlyInvestment}
                                onChange={(val) => form.setValue('monthlyInvestment', val)}
                            />

                            <SliderInput
                                label="Expected SIP Return"
                                suffix="%"
                                min={0.1} max={30} step={0.1}
                                value={vals.sipReturnRate}
                                onChange={(val) => form.setValue('sipReturnRate', val)}
                            />

                            <SliderInput
                                label="Bank FD/RD Return"
                                suffix="%"
                                min={0.1} max={15} step={0.1}
                                value={vals.fdInterestRate}
                                onChange={(val) => form.setValue('fdInterestRate', val)}
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
                            <div className="bg-brand-darkBg/50 backdrop-blur-sm border border-brand-surfaceBorder rounded-lg p-4 min-w-[140px] text-center border-b-2 border-b-brand-blue">
                                <p className="text-xs text-muted-foreground mb-1">SIP Final Value</p>
                                <p className="font-mono font-bold text-brand-blue">{formatCompactCurrency(res.option1Value)}</p>
                            </div>
                            <div className="bg-brand-darkBg/50 backdrop-blur-sm border border-brand-surfaceBorder rounded-lg p-4 min-w-[140px] text-center border-b-2 border-b-brand-purple">
                                <p className="text-xs text-muted-foreground mb-1">FD Final Value</p>
                                <p className="font-mono font-bold text-[#8B5CF6]">{formatCompactCurrency(res.option2Value)}</p>
                            </div>
                        </div>
                    </div>

                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6">
                            <h3 className="font-heading font-semibold mb-6 flex items-center gap-2 text-foreground">
                                <span className="w-2 h-2 rounded-full bg-brand-gold" />
                                Final Wealth Comparison
                            </h3>
                            <ComparisonChart data={chartData} />
                            <p className="text-xs text-muted-foreground mt-4 text-center">
                                Note: Total invested amount across both options is exactly the same ({formatCompactCurrency(vals.monthlyInvestment * vals.timePeriodYears * 12)}).
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
