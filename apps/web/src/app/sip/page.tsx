"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { calculateSIP, calculateStepUpSIP, calculateLumpsum } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { SIPChart } from "@/components/charts/SIPChart";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { SliderInput } from "@/components/ui/slider-input";

// Schemas
const sipSchema = z.object({
    monthlyInvestment: z.number().min(500).max(10000000),
    annualReturnRate: z.number().min(0.1).max(50),
    timePeriodYears: z.number().min(1).max(50),
});

const stepUpSchema = sipSchema.extend({
    annualStepUpRate: z.number().min(0.1).max(50),
});

const lumpsumSchema = z.object({
    principal: z.number().min(1000).max(100000000),
    annualReturnRate: z.number().min(0.1).max(50),
    timePeriodYears: z.number().min(1).max(50),
});

function ResultCard({ title, amount, color }: { title: string, amount: number, color: string }) {
    return (
        <div className="glass-card rounded-xl p-5 border-l-4" style={{ borderLeftColor: color }}>
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-mono font-bold text-foreground">{formatCompactCurrency(amount)}</p>
        </div>
    );
}

export default function SIPPage() {
    const [activeTab, setActiveTab] = useState("regular");

    // Regular SIP Form
    const formSip = useForm({
        resolver: zodResolver(sipSchema),
        defaultValues: { monthlyInvestment: 25000, annualReturnRate: 12, timePeriodYears: 10 },
    });
    const sipVals = formSip.watch();
    const sipRes = calculateSIP(sipVals);

    // Step-Up form
    const formStepUp = useForm({
        resolver: zodResolver(stepUpSchema),
        defaultValues: { monthlyInvestment: 25000, annualReturnRate: 12, timePeriodYears: 10, annualStepUpRate: 10 },
    });
    const stepUpVals = formStepUp.watch();
    const stepUpRes = calculateStepUpSIP(stepUpVals);

    // Lumpsum form
    const formLump = useForm({
        resolver: zodResolver(lumpsumSchema),
        defaultValues: { principal: 500000, annualReturnRate: 12, timePeriodYears: 10 },
    });
    const lumpVals = formLump.watch();
    const lumpRes = calculateLumpsum(lumpVals);

    const currentResult = activeTab === "regular" ? sipRes : activeTab === "stepup" ? stepUpRes : lumpRes;

    const finalBreakdown = currentResult.yearlyBreakdown;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                <h1 className="text-3xl font-heading font-bold text-foreground">Advanced SIP Analyzer</h1>
                <p className="text-muted-foreground mt-2">Project your wealth accumulation with precision.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Col - Inputs */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4">
                    <Tabs defaultValue="regular" onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full bg-brand-surface border border-brand-surfaceBorder h-auto p-1 grid grid-cols-3 rounded-lg mb-6">
                            <TabsTrigger value="regular" className="rounded-md py-2 data-[state=active]:bg-brand-gold/10 data-[state=active]:text-brand-gold">Regular</TabsTrigger>
                            <TabsTrigger value="stepup" className="rounded-md py-2 data-[state=active]:bg-brand-gold/10 data-[state=active]:text-brand-gold">Step-Up</TabsTrigger>
                            <TabsTrigger value="lumpsum" className="rounded-md py-2 data-[state=active]:bg-brand-gold/10 data-[state=active]:text-brand-gold">Lumpsum</TabsTrigger>
                        </TabsList>

                        <Card className="glass-card border-brand-surfaceBorder">
                            <CardContent className="pt-6 space-y-6">

                                {/* Regular Tab */}
                                <TabsContent value="regular" className="mt-0 space-y-6">
                                    <SliderInput
                                        label="Monthly Investment"
                                        symbol="₹"
                                        min={500} max={1000000} step={500}
                                        value={sipVals.monthlyInvestment}
                                        onChange={(val) => formSip.setValue('monthlyInvestment', val)}
                                    />
                                    <SliderInput
                                        label="Expected Return Rate"
                                        suffix="%"
                                        min={1} max={30} step={1}
                                        value={sipVals.annualReturnRate}
                                        onChange={(val) => formSip.setValue('annualReturnRate', val)}
                                    />
                                    <SliderInput
                                        label="Time Period"
                                        suffix="Yrs"
                                        min={1} max={40} step={1}
                                        value={sipVals.timePeriodYears}
                                        onChange={(val) => formSip.setValue('timePeriodYears', val)}
                                    />
                                </TabsContent>

                                {/* Step Up Tab */}
                                <TabsContent value="stepup" className="mt-0 space-y-6">
                                    <SliderInput
                                        label="Initial Monthly Inv."
                                        symbol="₹"
                                        min={500} max={1000000} step={500}
                                        value={stepUpVals.monthlyInvestment}
                                        onChange={(val) => formStepUp.setValue('monthlyInvestment', val)}
                                    />
                                    <SliderInput
                                        label="Annual Step-Up"
                                        suffix="%"
                                        min={0.1} max={50} step={0.1}
                                        value={stepUpVals.annualStepUpRate}
                                        onChange={(val) => formStepUp.setValue('annualStepUpRate', val)}
                                    />
                                    <SliderInput
                                        label="Expected Return Rate"
                                        suffix="%"
                                        min={0.1} max={30} step={0.1}
                                        value={stepUpVals.annualReturnRate}
                                        onChange={(val) => formStepUp.setValue('annualReturnRate', val)}
                                    />
                                    <SliderInput
                                        label="Time Period"
                                        suffix="Yrs"
                                        min={1} max={40} step={1}
                                        value={stepUpVals.timePeriodYears}
                                        onChange={(val) => formStepUp.setValue('timePeriodYears', val)}
                                    />
                                </TabsContent>

                                {/* Lumpsum Tab */}
                                <TabsContent value="lumpsum" className="mt-0 space-y-6">
                                    <SliderInput
                                        label="Total Investment"
                                        symbol="₹"
                                        min={10000} max={10000000} step={10000}
                                        value={lumpVals.principal}
                                        onChange={(val) => formLump.setValue('principal', val)}
                                    />
                                    <SliderInput
                                        label="Expected Return Rate"
                                        suffix="%"
                                        min={0.1} max={30} step={0.1}
                                        value={lumpVals.annualReturnRate}
                                        onChange={(val) => formLump.setValue('annualReturnRate', val)}
                                    />
                                    <SliderInput
                                        label="Time Period"
                                        suffix="Yrs"
                                        min={1} max={40} step={1}
                                        value={lumpVals.timePeriodYears}
                                        onChange={(val) => formLump.setValue('timePeriodYears', val)}
                                    />
                                </TabsContent>

                            </CardContent>
                        </Card>
                    </Tabs>
                </motion.div>

                {/* Right Col - Results */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-6">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ResultCard title="Invested Amount" amount={currentResult.investedAmount} color="#3B82F6" />
                        <ResultCard title="Est. Returns" amount={currentResult.estimatedReturns} color="#10B981" />
                        <ResultCard title="Total Value" amount={currentResult.totalValue} color="#F5A623" />
                    </div>

                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6">
                            <h3 className="font-heading font-semibold mb-6 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-gold" />
                                Wealth Accumulation Over Time
                            </h3>
                            <SIPChart data={finalBreakdown} />
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
