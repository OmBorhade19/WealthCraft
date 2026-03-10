"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { calculateHomeLoanVsSIP } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const schema = z.object({
    principal: z.number().min(500000).max(100000000),
    annualInterestRate: z.number().min(0.1).max(25),
    tenureYears: z.number().min(1).max(40),
    sipMonthly: z.number().min(500).max(1000000),
    sipReturn: z.number().min(0.1).max(30),
});

export default function HomeLoanPage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            principal: 5000000,
            annualInterestRate: 8.5,
            tenureYears: 20,
            sipMonthly: 20000,
            sipReturn: 12
        },
    });

    const vals = form.watch();
    const res = calculateHomeLoanVsSIP(
        { principal: vals.principal, annualInterestRate: vals.annualInterestRate, tenureYears: vals.tenureYears },
        vals.sipMonthly,
        vals.sipReturn
    );

    // Remap data for chart
    const tenureMonths = vals.tenureYears * 12;
    const chartData = [];

    // Create yearly snapshots for the combined chart
    for (let year = 1; year <= vals.tenureYears; year++) {
        const monthIndex = year * 12;
        const loanRow = res.emiResult.amortizationSchedule.find(r => r.month === monthIndex);
        const sipRow = res.sipResult.yearlyBreakdown.find(r => r.year === year);

        if (loanRow && sipRow) {
            chartData.push({
                year,
                loanBalance: loanRow.balance,
                sipValue: sipRow.totalValue
            });
        }
    }

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">Make Your Home Loan Interest Free!</h1>
                <p className="text-muted-foreground mt-2">See how a parallel SIP investment can completely offset your home loan interest burden over time</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col - Inputs */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-6">
                    <Card className="glass-card border-brand-surfaceBorder border-t-4 border-t-brand-danger">
                        <CardContent className="pt-6 space-y-6">
                            <h3 className="font-heading font-semibold text-brand-danger mb-4 text-sm tracking-wider uppercase">Loan Details</h3>
                            <SliderInput
                                label="Loan Amount"
                                symbol="₹"
                                min={500000} max={50000000} step={100000}
                                value={vals.principal}
                                onChange={(val) => form.setValue('principal', val)}
                            />
                            <SliderInput
                                label="Interest Rate"
                                suffix="%"
                                min={0.1} max={15} step={0.1}
                                value={vals.annualInterestRate}
                                onChange={(val) => form.setValue('annualInterestRate', val)}
                            />
                            <SliderInput
                                label="Tenure"
                                suffix="Yrs"
                                min={5} max={30} step={1}
                                value={vals.tenureYears}
                                onChange={(val) => form.setValue('tenureYears', val)}
                            />
                        </CardContent>
                    </Card>

                    <Card className="glass-card border-brand-surfaceBorder border-t-4 border-t-brand-success">
                        <CardContent className="pt-6 space-y-6">
                            <h3 className="font-heading font-semibold text-brand-success mb-4 text-sm tracking-wider uppercase">Recovery SIP</h3>
                            <SliderInput
                                label="Monthly SIP amount"
                                symbol="₹"
                                min={1000} max={200000} step={1000}
                                value={vals.sipMonthly}
                                onChange={(val) => form.setValue('sipMonthly', val)}
                            />
                            <SliderInput
                                label="Expected Return"
                                suffix="%"
                                min={0.1} max={25} step={0.1}
                                value={vals.sipReturn}
                                onChange={(val) => form.setValue('sipReturn', val)}
                            />
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Right Col - Results */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-7 space-y-6">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass-card rounded-xl p-5 border border-brand-danger/20">
                            <p className="text-xs text-brand-danger font-medium uppercase tracking-wider mb-2">Loan Interest Cost</p>
                            <p className="text-3xl font-mono font-bold text-foreground">{formatCompactCurrency(res.emiResult.totalInterest)}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                EMI: <span className="font-mono text-foreground font-medium">{formatCurrency(res.emiResult.emi)}</span>/mo
                            </p>
                        </div>
                        <div className="glass-card rounded-xl p-5 border border-brand-success/20">
                            <p className="text-xs text-brand-success font-medium uppercase tracking-wider mb-2">SIP Wealth Created</p>
                            <p className="text-3xl font-mono font-bold text-foreground">{formatCompactCurrency(res.sipResult.estimatedReturns)}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Final value: <span className="font-mono text-foreground font-medium">{formatCompactCurrency(res.sipResult.totalValue)}</span>
                            </p>
                        </div>
                    </div>

                    <div className={`glass-card p-6 rounded-xl border-l-4 ${res.difference > 0 ? 'border-l-brand-success bg-brand-success/5' : 'border-l-brand-gold bg-brand-gold/5'}`}>
                        <h4 className="text-lg font-heading font-semibold mb-2">Recommendation</h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">{res.recommendation}</p>
                    </div>

                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6">
                            <h3 className="font-heading font-semibold mb-6 flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                                Outstanding Loan vs SIP Value
                            </h3>

                            <div className="w-full h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                                        <defs>
                                            <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorSip" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="year"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#6B7FA3", fontSize: 12 }}
                                            dy={10}
                                            label={{ value: 'Years', position: 'insideBottom', offset: -25, fill: '#6B7FA3', fontSize: 14 }}
                                        />
                                        <YAxis
                                            tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: "#6B7FA3", fontSize: 12 }}
                                            width={50}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="glass-tooltip flex flex-col gap-2 min-w-[200px]">
                                                            <p className="font-medium text-muted-foreground border-b border-white/10 pb-2 mb-1">Year {label}</p>
                                                            <div className="flex justify-between items-center text-sm font-mono">
                                                                <span className="text-brand-danger">Loan Bal.</span>
                                                                <span>{formatCurrency(payload[0].value)}</span>
                                                            </div>
                                                            <div className="flex justify-between items-center text-sm font-mono">
                                                                <span className="text-brand-success">SIP Value</span>
                                                                <span>{formatCurrency(payload[1].value)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="loanBalance"
                                            name="Loan Balance"
                                            stroke="#EF4444"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorLoan)"
                                            animationDuration={1500}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="sipValue"
                                            name="SIP Value"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorSip)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                </motion.div>
            </div>
        </div>
    );
}
