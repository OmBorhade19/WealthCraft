"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { calculateLAMF } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { SliderInput } from "@/components/ui/slider-input";
import { AlertTriangle, CheckCircle, TrendingUp, ChevronDown, ChevronUp, Info } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell
} from "recharts";

const schema = z.object({
    portfolioValue: z.number().min(10000).max(1000000000),
    amountNeeded: z.number().min(1000).max(1000000000),
    originalInvestment: z.number().min(0).max(1000000000),
    holdingPeriodOver1Year: z.boolean(),
    fundType: z.enum(["equity", "debt"]),
    taxSlab: z.number(),
    loanInterestRate: z.number().min(0.1).max(30),
    ltvPercent: z.number().min(50).max(80),
    loanTenureMonths: z.number().min(1).max(60),
    repaymentType: z.enum(["interest-only", "full-emi"]),
    expectedMFReturnRate: z.number().min(0.1).max(50),
});

const TAX_SLABS = [0, 5, 10, 20, 30];

function CurrencyInput({ label, value, onChange, placeholder }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void; placeholder?: string }) {
    return (
        <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground/90">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                    type="text" inputMode="numeric"
                    placeholder={placeholder || "e.g. 10,00,000"}
                    className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md pl-7 pr-4 py-2 text-foreground text-sm focus:outline-none focus:border-brand-gold transition-colors"
                    value={value ? new Intl.NumberFormat("en-IN").format(value) : ""}
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        onChange(raw ? Number(raw) : undefined);
                    }}
                />
            </div>
        </div>
    );
}

function ToggleGroup({ options, value, onChange }: { options: { label: string; value: string }[]; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex gap-1 p-1 bg-brand-surface rounded-lg border border-brand-surfaceBorder">
            {options.map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)}
                    className={`flex-1 py-1.5 text-xs rounded-md transition-all font-medium ${value === opt.value ? "bg-foreground text-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {opt.label}
                </button>
            ))}
        </div>
    );
}

function LedgerRow({ label, value, highlight, red }: { label: string; value: string; highlight?: boolean; red?: boolean }) {
    return (
        <div className={`flex justify-between items-center text-sm py-1.5 border-b border-brand-surfaceBorder/30 last:border-0 ${highlight ? "font-bold" : ""}`}>
            <span className={highlight ? "text-foreground" : "text-muted-foreground"}>{label}</span>
            <span className={`font-mono ${red ? "text-brand-danger" : highlight ? "text-brand-gold" : "text-foreground"}`}>{value}</span>
        </div>
    );
}

export default function LoanAgainstMFPage() {
    const [showAmortization, setShowAmortization] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            portfolioValue: undefined as unknown as number,
            amountNeeded: undefined as unknown as number,
            originalInvestment: undefined as unknown as number,
            holdingPeriodOver1Year: true,
            fundType: "equity" as "equity" | "debt",
            taxSlab: 20,
            loanInterestRate: 10.5,
            ltvPercent: 70,
            loanTenureMonths: 12,
            repaymentType: "full-emi" as "interest-only" | "full-emi",
            expectedMFReturnRate: 12,
        },
    });

    const vals = form.watch();
    const isValid = !!(vals.portfolioValue && vals.amountNeeded && vals.originalInvestment && vals.loanInterestRate);
    const maxLoan = vals.portfolioValue ? vals.portfolioValue * (vals.ltvPercent / 100) : 0;
    const exceedsMax = vals.amountNeeded > maxLoan;

    const res = isValid ? calculateLAMF({
        portfolioValue: vals.portfolioValue,
        amountNeeded: vals.amountNeeded,
        originalInvestment: vals.originalInvestment,
        holdingPeriodOver1Year: vals.holdingPeriodOver1Year,
        fundType: vals.fundType,
        taxSlab: vals.taxSlab,
        loanInterestRate: vals.loanInterestRate,
        ltvPercent: vals.ltvPercent,
        loanTenureMonths: vals.loanTenureMonths,
        repaymentType: vals.repaymentType,
        expectedMFReturnRate: vals.expectedMFReturnRate,
    }) : null;

    const isLoanBetter = res?.comparison.betterOption === "loan";
    const isSellBetter = res?.comparison.betterOption === "sell";

    const chartData = res?.portfolioGrowthTimeline || [];
    const opportunityBarData = res ? [
        { name: "Kept Invested (Loan)", value: res.loanA.portfolioValueAtLoanEnd, color: "#eab308" },
        { name: "Remaining (Sold)", value: res.sellB.remainingPortfolioFutureValue, color: "#3b82f6" },
    ] : [];

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-20">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-heading font-bold text-foreground">Loan Against MF vs Selling</h1>
                <p className="text-muted-foreground mt-2">When you need urgent funds — should you pledge your mutual funds or sell them? Find out.</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ─── LEFT — INPUTS ─── */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-4">

                    {/* Section 1 */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-5 space-y-4">
                            <p className="text-xs text-brand-gold uppercase tracking-wider font-semibold">Your Mutual Fund Details</p>

                            <CurrencyInput label="MF Portfolio Value" value={vals.portfolioValue} onChange={(v) => form.setValue("portfolioValue", v as number)} placeholder="e.g. 20,00,000" />
                            <div>
                                <CurrencyInput label="Amount Needed" value={vals.amountNeeded} onChange={(v) => form.setValue("amountNeeded", v as number)} placeholder="e.g. 5,00,000" />
                                {vals.portfolioValue > 0 && vals.amountNeeded > 0 && (
                                    <p className={`text-xs mt-1 flex items-center gap-1 ${exceedsMax ? "text-brand-danger" : "text-brand-success"}`}>
                                        {exceedsMax
                                            ? <><AlertTriangle className="w-3 h-3" /> Exceeds maximum borrowing limit (₹{formatCompactCurrency(maxLoan)})</>
                                            : <><CheckCircle className="w-3 h-3" /> Within limit — Max: {formatCurrency(maxLoan)}</>
                                        }
                                    </p>
                                )}
                            </div>

                            <CurrencyInput label="Original Investment (Cost of Acquisition)" value={vals.originalInvestment} onChange={(v) => form.setValue("originalInvestment", v as number)} placeholder="e.g. 12,00,000" />

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Holding Period</label>
                                <ToggleGroup value={vals.holdingPeriodOver1Year ? "over" : "under"}
                                    onChange={(v) => form.setValue("holdingPeriodOver1Year", v === "over")}
                                    options={[{ label: "< 1 Year (STCG)", value: "under" }, { label: "> 1 Year (LTCG)", value: "over" }]} />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Fund Type</label>
                                <ToggleGroup value={vals.fundType} onChange={(v) => form.setValue("fundType", v as "equity" | "debt")}
                                    options={[{ label: "Equity Fund", value: "equity" }, { label: "Debt Fund", value: "debt" }]} />
                            </div>

                            {(vals.fundType === "debt" || !vals.holdingPeriodOver1Year) && (
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium">Your Income Tax Slab</label>
                                    <div className="flex gap-1 flex-wrap">
                                        {TAX_SLABS.map(slab => (
                                            <button key={slab} onClick={() => form.setValue("taxSlab", slab)}
                                                className={`px-3 py-1 rounded-md text-xs font-medium border transition-all ${vals.taxSlab === slab ? "bg-brand-gold text-black border-brand-gold" : "bg-brand-surface border-brand-surfaceBorder text-muted-foreground hover:border-brand-gold/50"}`}>
                                                {slab}%
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Section 2 */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-5 space-y-4">
                            <p className="text-xs text-brand-blue uppercase tracking-wider font-semibold">Loan Details</p>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Loan Interest Rate</label>
                                <div className="relative">
                                    <input type="number" step="0.1" placeholder="10.5"
                                        className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md px-4 py-2 pr-8 text-foreground text-sm focus:outline-none focus:border-brand-gold transition-colors"
                                        value={vals.loanInterestRate || ""} onChange={(e) => form.setValue("loanInterestRate", Number(e.target.value))} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">LTV — Loan to Value</label>
                                    <span className="text-sm font-mono text-brand-gold">{vals.ltvPercent}%</span>
                                </div>
                                {vals.portfolioValue > 0 && (
                                    <p className="text-xs text-muted-foreground mb-1">Max loan available: <span className="text-foreground font-mono">{formatCurrency(maxLoan)}</span></p>
                                )}
                                <SliderInput label="" min={50} max={80} step={1} value={vals.ltvPercent}
                                    onChange={(v) => form.setValue("ltvPercent", v)} />
                            </div>
                            <SliderInput label="Loan Tenure" suffix="months" min={1} max={60} step={1}
                                value={vals.loanTenureMonths} onChange={(v) => form.setValue("loanTenureMonths", v)} />
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Repayment Type</label>
                                <ToggleGroup value={vals.repaymentType} onChange={(v) => form.setValue("repaymentType", v as "interest-only" | "full-emi")}
                                    options={[{ label: "Interest Only", value: "interest-only" }, { label: "Full EMI", value: "full-emi" }]} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 3 */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-5 space-y-4">
                            <p className="text-xs text-brand-success uppercase tracking-wider font-semibold">MF Growth Assumption</p>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Expected MF Return Rate</label>
                                <div className="relative">
                                    <input type="number" step="0.1" placeholder="12"
                                        className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md px-4 py-2 pr-8 text-foreground text-sm focus:outline-none focus:border-brand-gold transition-colors"
                                        value={vals.expectedMFReturnRate || ""} onChange={(e) => form.setValue("expectedMFReturnRate", Number(e.target.value))} />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* ─── RIGHT — RESULTS ─── */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-6">

                    {(!isValid || !res) ? (
                        <div className="h-64 flex items-center justify-center border-2 border-dashed border-brand-surfaceBorder rounded-2xl text-muted-foreground text-sm text-center px-6">
                            Fill in your portfolio value, amount needed, and original investment to see the full comparison.
                        </div>
                    ) : (
                        <>
                            {/* CARD 1: WINNER CARD */}
                            <div className={`rounded-xl p-1 ${isLoanBetter ? "bg-gradient-to-r from-brand-gold/30 via-brand-gold/10 to-transparent" : isSellBetter ? "bg-gradient-to-r from-brand-success/30 via-brand-success/10 to-transparent" : "bg-brand-surface/20"} border ${isLoanBetter ? "border-brand-gold/40" : isSellBetter ? "border-brand-success/40" : "border-brand-surfaceBorder"}`}>
                                <div className="bg-background/80 backdrop-blur-sm rounded-lg p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-heading font-bold text-lg">Option Comparison</h2>
                                        {res.comparison.betterOption !== "neutral" && (
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${isLoanBetter ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/30" : "bg-brand-success/20 text-brand-success border border-brand-success/30"}`}>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {isLoanBetter ? `Loan saves ₹${formatCompactCurrency(res.comparison.wealthDifferenceAtEnd)}` : `Selling saves ₹${formatCompactCurrency(res.comparison.wealthDifferenceAtEnd)}`}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* Option A */}
                                        <div className={`rounded-lg p-4 border-2 ${isLoanBetter ? "border-brand-gold bg-brand-gold/5" : "border-brand-surfaceBorder/50 bg-brand-surface/20"}`}>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isLoanBetter ? "text-brand-gold" : "text-muted-foreground"}`}>
                                                {isLoanBetter && "✅ "} Option A — Loan Against MF
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-muted-foreground">Cash Received</span><span className="font-mono">{formatCompactCurrency(res.loanA.loanAmount)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Tax Paid</span><span className="font-mono text-brand-success">₹0</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Exit Load</span><span className="font-mono text-brand-success">₹0</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Interest Paid</span><span className="font-mono text-brand-danger">{formatCompactCurrency(res.loanA.totalInterestPaid)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">MF Growth</span><span className="font-mono text-brand-success">+{formatCompactCurrency(res.loanA.portfolioGrowthDuringLoan)}</span></div>
                                                <div className="border-t border-brand-surfaceBorder/30 pt-2 flex justify-between font-bold">
                                                    <span>Net Wealth</span>
                                                    <span className={`font-mono ${isLoanBetter ? "text-brand-gold" : ""}`}>{formatCompactCurrency(res.loanA.netWealthAtEnd)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Option B */}
                                        <div className={`rounded-lg p-4 border-2 ${isSellBetter ? "border-brand-success bg-brand-success/5" : "border-brand-surfaceBorder/50 bg-brand-surface/20"}`}>
                                            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${isSellBetter ? "text-brand-success" : "text-muted-foreground"}`}>
                                                {isSellBetter && "✅ "} Option B — Sell MF Units
                                            </p>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between"><span className="text-muted-foreground">Cash Received</span><span className="font-mono">{formatCompactCurrency(res.sellB.netCashReceived)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Tax Paid</span><span className="font-mono text-brand-danger">{formatCompactCurrency(res.sellB.taxPaid)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Exit Load</span><span className="font-mono text-brand-danger">{formatCompactCurrency(res.sellB.exitLoadAmount)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Interest Paid</span><span className="font-mono text-brand-success">₹0</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">Opp. Cost Lost</span><span className="font-mono text-brand-danger">{formatCompactCurrency(res.sellB.opportunityCostOfSelling)}</span></div>
                                                <div className="border-t border-brand-surfaceBorder/30 pt-2 flex justify-between font-bold">
                                                    <span>Net Wealth</span>
                                                    <span className={`font-mono ${isSellBetter ? "text-brand-success" : ""}`}>{formatCompactCurrency(res.sellB.netWealthAtEnd)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* CARD 2: TAX BREAKDOWN */}
                                <Card className="glass-card border-brand-surfaceBorder">
                                    <CardContent className="pt-5">
                                        <p className="text-xs text-brand-danger uppercase tracking-wider font-bold mb-4">Tax Breakdown — Option B (Selling)</p>
                                        <div className="space-y-0.5">
                                            <LedgerRow label="Fund Type" value={res.taxCalculation.fundType} />
                                            <LedgerRow label="Holding Period" value={res.taxCalculation.holdingPeriod} />
                                            <LedgerRow label="Tax Type" value={res.taxCalculation.taxType.split("(")[0].trim()} />
                                            <LedgerRow label="Applicable Rate" value={res.taxCalculation.applicableRate} />
                                            <div className="my-2 border-t border-brand-surfaceBorder/50" />
                                            <LedgerRow label="Amount Redeemed" value={formatCurrency(res.sellB.grossCashReceived)} />
                                            <LedgerRow label="Cost of Acquisition" value={formatCurrency(res.taxCalculation.proportionalCostOfAcquisition)} />
                                            <LedgerRow label="Total Capital Gain" value={formatCurrency(res.taxCalculation.totalGainOnSoldPortion)} />
                                            {res.taxCalculation.exemption > 0 && <LedgerRow label="LTCG Exemption (§112A)" value={`–${formatCurrency(res.taxCalculation.exemption)}`} />}
                                            <LedgerRow label="Taxable Gain" value={formatCurrency(res.taxCalculation.taxableGain)} />
                                            <div className="my-2 border-t border-brand-surfaceBorder/50" />
                                            <LedgerRow label="TAX PAYABLE" value={formatCurrency(res.taxCalculation.taxAmount)} highlight red={res.taxCalculation.taxAmount > 0} />
                                            <LedgerRow label="Exit Load" value={formatCurrency(res.taxCalculation.exitLoad)} red={res.taxCalculation.exitLoad > 0} />
                                            <div className="my-2 border-t-2 border-brand-surfaceBorder" />
                                            <LedgerRow label="TOTAL COST OF SELLING" value={formatCurrency(res.taxCalculation.totalCostOfSelling)} highlight red />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* CARD 3: LOAN COST BREAKDOWN */}
                                <Card className="glass-card border-brand-surfaceBorder">
                                    <CardContent className="pt-5">
                                        <p className="text-xs text-brand-gold uppercase tracking-wider font-bold mb-4">Loan Cost Breakdown — Option A</p>
                                        <div className="space-y-0.5">
                                            <LedgerRow label="Loan Amount" value={formatCurrency(res.loanA.loanAmount)} />
                                            <LedgerRow label="Interest Rate" value={`${vals.loanInterestRate}% p.a.`} />
                                            <LedgerRow label="Tenure" value={`${vals.loanTenureMonths} months`} />
                                            <LedgerRow label="Repayment Type" value={vals.repaymentType === "full-emi" ? "Full EMI" : "Interest Only"} />
                                            <div className="my-2 border-t border-brand-surfaceBorder/50" />
                                            <LedgerRow label={vals.repaymentType === "full-emi" ? "Monthly EMI" : "Monthly Interest"} value={formatCurrency(vals.repaymentType === "full-emi" ? res.loanA.monthlyEMI : res.loanA.monthlyInterestOnly)} />
                                            <LedgerRow label="Total Amount Repaid" value={formatCurrency(res.loanA.totalRepayment)} />
                                            <LedgerRow label="Principal" value={formatCurrency(res.loanA.loanAmount)} />
                                            <LedgerRow label="TOTAL INTEREST PAID" value={formatCurrency(res.loanA.totalInterestPaid)} highlight red />
                                            <div className="my-2 border-t border-brand-surfaceBorder/50" />
                                            <LedgerRow label="Tax on Loan" value="₹0 (No tax event)" />
                                        </div>
                                        <div className="mt-4 p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50 text-xs text-muted-foreground">
                                            {res.loanA.totalInterestPaid > res.taxCalculation.totalCostOfSelling
                                                ? <>Loan costs <span className="text-brand-danger font-bold">{formatCurrency(res.comparison.loanInterestCost - res.comparison.sellingTaxCost)}</span> more in direct cost — but selling loses compounding.</>
                                                : <>Loan is cheaper by <span className="text-brand-success font-bold">{formatCurrency(res.comparison.sellingTaxCost - res.comparison.loanInterestCost)}</span> vs selling costs (tax + exit load).</>
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* CARD 4: OPPORTUNITY COST */}
                            <Card className="glass-card border-brand-surfaceBorder overflow-hidden">
                                <CardContent className="pt-5">
                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        <div className="flex-1">
                                            <p className="text-xs text-brand-success uppercase tracking-wider font-bold mb-3">
                                                <TrendingUp className="inline w-3.5 h-3.5 mr-1" />Opportunity Cost of Selling
                                            </p>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                By NOT selling, your <span className="text-foreground font-semibold">{formatCompactCurrency(vals.portfolioValue)}</span> portfolio stays fully invested and grows to{" "}
                                                <span className="text-brand-gold font-bold">{formatCompactCurrency(res.loanA.portfolioValueAtLoanEnd)}</span> in {vals.loanTenureMonths} months at {vals.expectedMFReturnRate}% p.a. —
                                                a gain of <span className="text-brand-success font-bold">{formatCompactCurrency(res.loanA.portfolioGrowthDuringLoan)}</span> you would permanently lose by selling.
                                            </p>
                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="p-3 rounded-lg bg-brand-gold/10 border border-brand-gold/20">
                                                    <p className="text-xs text-brand-gold mb-1">If Loan Taken — Portfolio at End</p>
                                                    <p className="text-lg font-bold font-mono text-brand-gold">{formatCompactCurrency(res.loanA.portfolioValueAtLoanEnd)}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50">
                                                    <p className="text-xs text-muted-foreground mb-1">If Sold — Remaining Portfolio at End</p>
                                                    <p className="text-lg font-bold font-mono">{formatCompactCurrency(res.sellB.remainingPortfolioFutureValue)}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full md:w-64 h-[180px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={opportunityBarData} margin={{ top: 0, right: 0, left: 0, bottom: 35 }}>
                                                    <XAxis dataKey="name" tick={{ fill: "#6B7FA3", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} dy={8}
                                                        label={{ value: "Option", position: "insideBottom", offset: -25, fill: "#6B7FA3", fontSize: 11 }} />
                                                    <YAxis tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} tick={{ fill: "#6B7FA3", fontSize: 10 }} axisLine={false} tickLine={false} width={45} />
                                                    <Tooltip formatter={(v: any) => [formatCurrency(v), "Portfolio Value"]} contentStyle={{ backgroundColor: "rgb(24 24 27)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                        {opportunityBarData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CARD 5: GROWTH TIMELINE CHART */}
                            <Card className="glass-card border-brand-surfaceBorder">
                                <CardContent className="pt-5">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Portfolio Growth Timeline</p>
                                    <p className="text-xs text-muted-foreground mb-4">Gold: Full portfolio if loan taken. Blue dashed: Remaining portfolio after selling units.</p>
                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" axisLine={false} tickLine={false}
                                                    label={{ value: "Months", position: "insideBottom", offset: -25, fill: "rgba(255,255,255,0.4)", fontSize: 14 }} />
                                                <YAxis stroke="rgba(255,255,255,0.3)" tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} axisLine={false} tickLine={false} dx={-5} />
                                                <Tooltip contentStyle={{ backgroundColor: "rgb(24 24 27)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px" }}
                                                    formatter={(value: any, name: any) => [formatCurrency(value), name === "mfValueIfPledged" ? "Portfolio (Loan)" : "Remaining (Sold)"]}
                                                    labelFormatter={(l) => `Month ${l}`} />
                                                <Line type="monotone" dataKey="mfValueIfPledged" stroke="#eab308" strokeWidth={3} dot={false} name="mfValueIfPledged" />
                                                <Line type="monotone" dataKey="remainingPortfolioValue" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="remainingPortfolioValue" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* CARD 6: AMORTIZATION TABLE — Full EMI only */}
                            {vals.repaymentType === "full-emi" && (
                                <div>
                                    <button onClick={() => setShowAmortization(!showAmortization)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-surface border border-brand-surfaceBorder text-sm font-medium hover:bg-brand-surface/80 transition-colors w-full justify-center">
                                        {showAmortization ? <><ChevronUp className="w-4 h-4" />Hide EMI Schedule</> : <><ChevronDown className="w-4 h-4" />Show EMI Schedule</>}
                                    </button>
                                    <AnimatePresence>
                                        {showAmortization && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-4">
                                                <Card className="glass-card border-brand-surfaceBorder overflow-hidden">
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-[10px] uppercase text-muted-foreground bg-brand-surface/40 border-b border-brand-surfaceBorder">
                                                                <tr>
                                                                    <th className="px-4 py-3">Month</th>
                                                                    <th className="px-4 py-3 text-right">Opening</th>
                                                                    <th className="px-4 py-3 text-right">EMI</th>
                                                                    <th className="px-4 py-3 text-right text-brand-danger">Interest</th>
                                                                    <th className="px-4 py-3 text-right text-brand-success">Principal</th>
                                                                    <th className="px-4 py-3 text-right">Closing</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-brand-surfaceBorder/30">
                                                                {res.loanAmortization.map((row) => (
                                                                    <tr key={row.month} className="hover:bg-brand-surface/20 transition-colors">
                                                                        <td className="px-4 py-2.5 font-medium">M{row.month}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.openingPrincipal)}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.emi)}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono text-brand-danger">{formatCurrency(row.interestComponent)}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono text-brand-success">{formatCurrency(row.principalComponent)}</td>
                                                                        <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(row.closingPrincipal)}</td>
                                                                    </tr>
                                                                ))}
                                                                <tr className="bg-brand-surface/40 font-bold">
                                                                    <td className="px-4 py-2.5 text-muted-foreground">Total</td>
                                                                    <td className="px-4 py-2.5"></td>
                                                                    <td className="px-4 py-2.5 text-right font-mono">{formatCurrency(res.loanA.totalRepayment)}</td>
                                                                    <td className="px-4 py-2.5 text-right font-mono text-brand-danger">{formatCurrency(res.loanA.totalInterestPaid)}</td>
                                                                    <td className="px-4 py-2.5 text-right font-mono text-brand-success">{formatCurrency(res.loanA.loanAmount)}</td>
                                                                    <td className="px-4 py-2.5"></td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* CARD 7: DYNAMIC INSIGHTS */}
                            <Card className="glass-card border-brand-surfaceBorder">
                                <CardContent className="pt-5">
                                    <p className="text-xs text-foreground/60 uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" /> Key Insights
                                    </p>
                                    <div className="space-y-3 text-sm">
                                        {/* Insight 1: Tax vs Interest direct */}
                                        {res.comparison.sellingTaxCost > res.loanA.totalInterestPaid ? (
                                            <div className="flex gap-3 p-3 rounded-lg bg-brand-success/5 border border-brand-success/20">
                                                <span className="text-lg">✅</span>
                                                <p className="text-foreground/80 leading-relaxed">
                                                    Taking a loan saves you <span className="text-brand-success font-bold">{formatCurrency(res.comparison.sellingTaxCost - res.loanA.totalInterestPaid)}</span> in direct costs — your tax liability ({formatCurrency(res.comparison.sellingTaxCost)}) exceeds the loan interest ({formatCurrency(res.loanA.totalInterestPaid)}).
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                                <span className="text-lg">⚠</span>
                                                <p className="text-foreground/80 leading-relaxed">
                                                    Selling is cheaper by <span className="text-amber-500 font-bold">{formatCurrency(res.loanA.totalInterestPaid - res.comparison.sellingTaxCost)}</span> in direct costs. However, factor in the <span className="text-brand-danger font-bold">{formatCurrency(res.sellB.opportunityCostOfSelling)}</span> compounding you permanently lose by selling.
                                                </p>
                                            </div>
                                        )}

                                        {/* Insight 2: STCG warning */}
                                        {!vals.holdingPeriodOver1Year && vals.fundType === "equity" && (
                                            <div className="flex gap-3 p-3 rounded-lg bg-brand-danger/5 border border-brand-danger/20">
                                                <span className="text-lg">⚠</span>
                                                <p className="text-foreground/80 leading-relaxed">
                                                    Since you've held for less than 1 year, STCG of <span className="text-brand-danger font-bold">15%</span> applies — much higher than LTCG. This makes the loan option significantly more attractive.
                                                </p>
                                            </div>
                                        )}

                                        {/* Insight 3: Zero tax (gain < 1L) */}
                                        {vals.fundType === "equity" && vals.holdingPeriodOver1Year && res.taxCalculation.taxAmount === 0 && (
                                            <div className="flex gap-3 p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/20">
                                                <span className="text-lg">💡</span>
                                                <p className="text-foreground/80 leading-relaxed">
                                                    Your capital gain (<span className="font-bold">{formatCurrency(res.taxCalculation.totalGainOnSoldPortion)}</span>) is within the ₹1 Lakh LTCG exemption limit. Selling incurs <span className="text-brand-success font-bold">ZERO tax</span> — selling may actually be better in your case.
                                                </p>
                                            </div>
                                        )}

                                        {/* Insight 4: Compounding power */}
                                        <div className="flex gap-3 p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50">
                                            <span className="text-lg">💡</span>
                                            <p className="text-foreground/80 leading-relaxed">
                                                The loan keeps your <span className="font-bold">{formatCompactCurrency(vals.portfolioValue)}</span> fully invested and compounding. At {vals.expectedMFReturnRate}% p.a., your portfolio grows to <span className="text-brand-gold font-bold">{formatCompactCurrency(res.loanA.portfolioValueAtLoanEnd)}</span> by the time you repay.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* DISCLAIMER */}
                            <p className="text-xs text-center text-muted-foreground opacity-50 px-4">
                                Disclaimer: Tax calculations are based on Indian income tax rules (FY 2024-25). LTCG rates and exemption limits may change. Exit load varies by fund. This tool is for educational purposes only and does not constitute financial advice.
                            </p>
                        </>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
