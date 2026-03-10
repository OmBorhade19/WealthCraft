"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calculateIncomeTax } from "@wealthcraft/financial-engine";
import type { TaxInput, TaxResult, RegimeResult } from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CheckCircle, AlertTriangle, Info } from "lucide-react";

// ─── INPUT COMPONENT ──────────────────────────────────────────────────────────

function CurrencyField({ label, hint, value, onChange, capped }: {
    label: string; hint?: string; value: number | undefined;
    onChange: (v: number | undefined) => void; capped?: boolean;
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-brand-surfaceBorder/30 last:border-0">
            <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/90 leading-snug">{label}</p>
                {hint && <p className={`text-[11px] mt-0.5 leading-snug ${capped ? "text-amber-400" : "text-muted-foreground/70"}`}>{hint}</p>}
            </div>
            <div className="relative w-36 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₹</span>
                <input
                    type="text" inputMode="numeric" placeholder="0"
                    className="w-full bg-background/50 border border-brand-surfaceBorder rounded-md pl-7 pr-3 py-1.5 text-sm text-right font-mono text-foreground focus:outline-none focus:border-brand-gold transition-colors"
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

function Section({ title, note, children, defaultOpen = true }: { title: string; note?: string; children: React.ReactNode; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-brand-surfaceBorder rounded-xl overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-3.5 bg-brand-surface/40 hover:bg-brand-surface/60 transition-colors">
                <span className="text-sm font-semibold text-foreground tracking-wide">{title}</span>
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                        <div className="px-5 pb-4 pt-1">
                            {note && <p className="text-[11px] text-muted-foreground/70 italic mt-2 mb-1">{note}</p>}
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function LedgerRow({ label, value, sub, bold, red, green, strike, indent }: {
    label: string; value: string; sub?: boolean; bold?: boolean; red?: boolean; green?: boolean; strike?: boolean; indent?: boolean;
}) {
    return (
        <div className={`flex justify-between items-start py-1.5 border-b border-brand-surfaceBorder/20 last:border-0 text-sm ${bold ? "font-bold" : ""} ${indent ? "pl-4" : ""}`}>
            <span className={`${sub ? "text-muted-foreground text-xs" : ""} ${strike ? "line-through opacity-40" : ""}`}>{label}</span>
            <span className={`font-mono ${red ? "text-brand-danger" : green ? "text-brand-success" : bold ? "text-brand-gold" : strike ? "opacity-40 line-through" : ""}`}>{value}</span>
        </div>
    );
}

// ─── SLAB BAR ─────────────────────────────────────────────────────────────────

function SlabBar({ rows, taxableIncome }: { rows: { taxableAmount: number; rate: number }[]; taxableIncome: number }) {
    const colors: Record<number, string> = { 0: "#374151", 5: "#1d4ed8", 10: "#7c3aed", 15: "#0891b2", 20: "#d97706", 25: "#db2777", 30: "#dc2626" };
    if (!taxableIncome) return null;
    return (
        <div className="space-y-2 mb-4">
            <div className="flex h-7 rounded-lg overflow-hidden gap-0.5">
                {rows.filter(r => r.taxableAmount > 0).map((r, i) => (
                    <div key={i}
                        style={{ width: `${(r.taxableAmount / taxableIncome) * 100}%`, backgroundColor: colors[r.rate] ?? "#6b7280" }}
                        title={`${r.rate}% — ₹${r.taxableAmount.toLocaleString("en-IN")}`}
                        className="transition-all" />
                ))}
            </div>
            <div className="flex flex-wrap gap-3">
                {rows.filter(r => r.taxableAmount > 0).map((r, i) => (
                    <div key={i} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: colors[r.rate] ?? "#6b7280" }} />
                        {r.rate}%
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

const DEFAULT: TaxInput = {
    assessmentYear: "AY2026-27",
    ageCategory: "below60",
    grossSalary: 0, otherIncome: 0, interestIncome: 0,
    rentalIncome: 0, homeLoanInterestSelfOccupied: 0, homeLoanInterestLetOut: 0,
    section80C: 0, section80CCD1B: 0, section80D: 0,
    section80G: 0, section80E: 0, section80TTA_TTB: 0,
    basicSalary: 0, da: 0, hraReceived: 0, rentPaid: 0, isMetroCity: false,
};

export default function IncomeTaxPage() {
    const [vals, setVals] = useState<TaxInput>(DEFAULT);
    const [res, setRes] = useState<TaxResult | null>(null);
    const [activeTab, setActiveTab] = useState<"old" | "new">("new");
    const resultsRef = useRef<HTMLDivElement>(null);

    function set(key: keyof TaxInput, value: any) {
        setVals(prev => ({ ...prev, [key]: value }));
    }

    function handleCalculate() {
        const result = calculateIncomeTax(vals);
        setRes(result);
        setActiveTab(result.recommendedRegime);
        setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    }

    const isSenior = vals.ageCategory === "senior60to80" || vals.ageCategory === "superSeniorAbove80";

    // Cap hints
    const s80CCapped = vals.section80C > 150000;
    const s80NPSCapped = vals.section80CCD1B > 50000;
    const s80DCapped = vals.section80D > (isSenior ? 50000 : 25000);
    const sTTACapped = vals.section80TTA_TTB > (isSenior ? 50000 : 10000);

    // Live HRA for preview
    const liveHRA = vals.hraReceived > 0 && vals.rentPaid > 0 && vals.basicSalary > 0
        ? calculateIncomeTax(vals).hraExemption : 0;

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full space-y-8 pb-20">
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-heading font-bold text-foreground">Income Tax Calculator</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                    AY 2026-27 (FY 2025-26) · Budget 2025 · New Regime ₹60,000 Rebate · Old & New Comparison
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* ── LEFT INPUTS ── */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-5 space-y-4">

                    {/* Top Selectors */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assessment Year</label>
                            <select value={vals.assessmentYear} onChange={e => set("assessmentYear", e.target.value as any)}
                                className="w-full bg-brand-surface border border-brand-surfaceBorder rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold">
                                <option value="AY2026-27">AY 2026-27 (FY 2025-26)</option>
                                <option value="AY2025-26">AY 2025-26 (FY 2024-25)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Age Category</label>
                            <select value={vals.ageCategory} onChange={e => set("ageCategory", e.target.value as any)}
                                className="w-full bg-brand-surface border border-brand-surfaceBorder rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-brand-gold">
                                <option value="below60">Below 60</option>
                                <option value="senior60to80">60 – 80 (Senior)</option>
                                <option value="superSeniorAbove80">Above 80 (Super Senior)</option>
                            </select>
                        </div>
                    </div>

                    {/* Section 1: Income */}
                    <Section title="INCOME">
                        <CurrencyField label="Gross salary income" value={vals.grossSalary || undefined} onChange={v => set("grossSalary", v || 0)} />
                        <CurrencyField label="Annual income from other sources" value={vals.otherIncome || undefined} onChange={v => set("otherIncome", v || 0)} />
                        <CurrencyField label="Annual income from interest" value={vals.interestIncome || undefined} onChange={v => set("interestIncome", v || 0)} />
                        <CurrencyField label="Annual income from let-out house property (rental income)" value={vals.rentalIncome || undefined} onChange={v => set("rentalIncome", v || 0)} />
                        <CurrencyField label="Annual interest paid on home loan (self-occupied)"
                            hint="Deduction max ₹2,00,000 under Old Regime only"
                            value={vals.homeLoanInterestSelfOccupied || undefined}
                            onChange={v => set("homeLoanInterestSelfOccupied", v || 0)} />
                        <CurrencyField label="Annual interest paid on home loan (let-out)"
                            hint="Fully deductible against rental income in both regimes"
                            value={vals.homeLoanInterestLetOut || undefined}
                            onChange={v => set("homeLoanInterestLetOut", v || 0)} />
                    </Section>

                    {/* Section 2: Deductions */}
                    <Section title="DEDUCTIONS" note="These deductions apply to Old Regime only. Under New Regime only 80CCD(1B) is allowed.">
                        <CurrencyField label="Basic deductions u/s 80C"
                            hint={s80CCapped ? "Capped at ₹1,50,000 (maximum limit)" : "Max ₹1,50,000"}
                            capped={s80CCapped}
                            value={vals.section80C || undefined} onChange={v => set("section80C", v || 0)} />
                        <CurrencyField label="Contribution to NPS u/s 80CCD(1B)"
                            hint={s80NPSCapped ? "Capped at ₹50,000" : "Max ₹50,000 — allowed in both regimes"}
                            capped={s80NPSCapped}
                            value={vals.section80CCD1B || undefined} onChange={v => set("section80CCD1B", v || 0)} />
                        <CurrencyField label="Medical Insurance Premium u/s 80D"
                            hint={s80DCapped ? `Capped at ₹${isSenior ? "50,000" : "25,000"}` : `Max ₹${isSenior ? "50,000 (senior)" : "25,000"}`}
                            capped={s80DCapped}
                            value={vals.section80D || undefined} onChange={v => set("section80D", v || 0)} />
                        <CurrencyField label="Donation to charity u/s 80G"
                            hint="50% of amount is eligible as deduction"
                            value={vals.section80G || undefined} onChange={v => set("section80G", v || 0)} />
                        <CurrencyField label="Interest on Educational Loan u/s 80E"
                            hint="No upper limit"
                            value={vals.section80E || undefined} onChange={v => set("section80E", v || 0)} />
                        <CurrencyField label="Interest on deposits in saving account u/s 80TTA/TTB"
                            hint={sTTACapped ? `Capped at ₹${isSenior ? "50,000" : "10,000"}` : `Max ₹${isSenior ? "50,000 (80TTB — senior)" : "10,000 (80TTA)"}`}
                            capped={sTTACapped}
                            value={vals.section80TTA_TTB || undefined} onChange={v => set("section80TTA_TTB", v || 0)} />
                    </Section>

                    {/* Section 3: HRA */}
                    <Section title="HRA EXEMPTION" note="HRA exemption applies to Old Regime only">
                        <CurrencyField label="Basic salary received per annum" value={vals.basicSalary || undefined} onChange={v => set("basicSalary", v || 0)} />
                        <CurrencyField label="Dearness allowance (DA) received per annum" value={vals.da || undefined} onChange={v => set("da", v || 0)} />
                        <CurrencyField label="HRA received per annum" value={vals.hraReceived || undefined} onChange={v => set("hraReceived", v || 0)} />
                        <CurrencyField label="Total rent paid per annum" value={vals.rentPaid || undefined} onChange={v => set("rentPaid", v || 0)} />
                        <div className="flex items-center justify-between py-3 border-b border-brand-surfaceBorder/30">
                            <div>
                                <p className="text-sm text-foreground/90">Do you live in a metro city?</p>
                                <p className="text-[11px] text-muted-foreground/70">Mumbai, Delhi, Chennai, Kolkata = 50% exemption</p>
                            </div>
                            <select value={vals.isMetroCity ? "yes" : "no"} onChange={e => set("isMetroCity", e.target.value === "yes")}
                                className="bg-brand-surface border border-brand-surfaceBorder rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-brand-gold">
                                <option value="yes">Yes (Mumbai/Delhi/Chennai/Kolkata)</option>
                                <option value="no">No (Other cities)</option>
                            </select>
                        </div>
                        <div className="mt-3 text-xs flex items-center gap-2 text-muted-foreground">
                            {liveHRA > 0
                                ? <><CheckCircle className="w-3.5 h-3.5 text-brand-success" /> <span className="text-brand-success font-medium">HRA Exemption: {formatCurrency(liveHRA)}</span></>
                                : <span>HRA Exemption: ₹0 (fill rent and HRA fields to calculate)</span>}
                        </div>
                    </Section>

                    <button onClick={handleCalculate}
                        className="w-full py-4 rounded-xl bg-brand-gold text-black font-bold text-base tracking-wide hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-brand-gold/20">
                        CALCULATE TAX
                    </button>
                </motion.div>

                {/* ── RIGHT RESULTS ── */}
                <div ref={resultsRef} className="lg:col-span-7 space-y-6">
                    <AnimatePresence>
                        {!res ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="h-64 flex items-center justify-center border-2 border-dashed border-brand-surfaceBorder rounded-2xl text-muted-foreground text-sm text-center px-6">
                                Fill in your income details and click CALCULATE TAX to see the comparison.
                            </motion.div>
                        ) : (
                            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

                                {/* CARD 1: REGIME COMPARISON */}
                                <div className={`rounded-xl p-0.5 border ${res.recommendedRegime === "new" ? "border-brand-gold/50" : "border-brand-success/50"}`}>
                                    <div className="bg-background/85 backdrop-blur-sm rounded-xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-heading font-bold text-lg">Regime Comparison</h2>
                                            <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${res.recommendedRegime === "new" ? "bg-brand-gold/20 text-brand-gold border border-brand-gold/30" : "bg-brand-success/20 text-brand-success border border-brand-success/30"}`}>
                                                <CheckCircle className="w-3.5 h-3.5" />
                                                {res.recommendedRegime === "new" ? "New" : "Old"} Regime saves {formatCompactCurrency(res.taxSavedByChoosingBetter)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {(["old", "new"] as const).map(regime => {
                                                const r = res[`${regime}Regime`];
                                                const isBetter = res.recommendedRegime === regime;
                                                return (
                                                    <div key={regime} className={`rounded-lg p-3 border-2 ${isBetter ? (regime === "new" ? "border-brand-gold bg-brand-gold/5" : "border-brand-success bg-brand-success/5") : "border-brand-surfaceBorder/40 bg-brand-surface/20"}`}>
                                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isBetter ? (regime === "new" ? "text-brand-gold" : "text-brand-success") : "text-muted-foreground"}`}>
                                                            {isBetter && "✅ "}{regime === "old" ? "OLD REGIME" : "NEW REGIME"}{isBetter && " · RECOMMENDED"}
                                                        </p>
                                                        <div className="space-y-1 text-xs text-muted-foreground">
                                                            <div className="flex justify-between gap-1"><span className="truncate">Gross Salary</span><span className="font-mono text-foreground shrink-0">{formatCompactCurrency(r.grossSalary)}</span></div>
                                                            <div className="flex justify-between gap-1"><span className="truncate">– Std. Deduction</span><span className="font-mono text-brand-success shrink-0">–{formatCompactCurrency(r.standardDeduction)}</span></div>
                                                            {regime === "old" && r.hraExemption > 0 && <div className="flex justify-between gap-1"><span className="truncate">– HRA</span><span className="font-mono text-brand-success shrink-0">–{formatCompactCurrency(r.hraExemption)}</span></div>}
                                                            {regime === "new" && <div className="flex justify-between gap-1"><span className="truncate text-muted-foreground/50">– HRA</span><span className="font-mono text-muted-foreground/50 shrink-0">N/A</span></div>}
                                                            {r.homeLoanDeductionSelfOccupied > 0 && <div className="flex justify-between gap-1"><span className="truncate">– Home Loan 24B</span><span className="font-mono text-brand-success shrink-0">–{formatCompactCurrency(r.homeLoanDeductionSelfOccupied)}</span></div>}
                                                            <div className="flex justify-between gap-1 border-t border-brand-surfaceBorder/20 pt-1"><span>Gross Total Income</span><span className="font-mono text-foreground font-semibold shrink-0">{formatCompactCurrency(r.grossTotalIncome)}</span></div>
                                                            {r.totalDeductions > 0 && <div className="flex justify-between gap-1"><span>– Deductions</span><span className="font-mono text-brand-success shrink-0">–{formatCompactCurrency(r.totalDeductions)}</span></div>}
                                                            <div className="flex justify-between gap-1 font-semibold text-foreground border-t border-brand-surfaceBorder/20 pt-1"><span>Taxable Income</span><span className="font-mono shrink-0">{formatCompactCurrency(r.taxableIncome)}</span></div>
                                                            <div className="border-t border-brand-surfaceBorder/20 my-1" />
                                                            <div className="flex justify-between gap-1"><span>Basic Tax</span><span className="font-mono shrink-0">{formatCompactCurrency(r.basicTax)}</span></div>
                                                            {r.surcharge > 0 && <div className="flex justify-between gap-1"><span>Surcharge</span><span className="font-mono text-brand-danger shrink-0">+{formatCompactCurrency(r.surcharge)}</span></div>}
                                                            <div className="flex justify-between gap-1"><span>Cess (4%)</span><span className="font-mono shrink-0">{formatCompactCurrency(r.educationCess)}</span></div>
                                                            {r.rebate87A > 0 && <div className="flex justify-between gap-1"><span>87A Rebate</span><span className="font-mono text-brand-success shrink-0">–{formatCompactCurrency(r.rebate87A)}</span></div>}
                                                            <div className="border-t border-brand-surfaceBorder/30 mt-1 pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                                                <span>TOTAL TAX</span>
                                                                <span className={`font-mono shrink-0 ${isBetter ? (regime === "new" ? "text-brand-gold" : "text-brand-success") : ""}`}>{formatCompactCurrency(r.taxAfterRebate)}</span>
                                                            </div>
                                                            <div className="flex justify-between gap-1"><span>Monthly Tax</span><span className="font-mono shrink-0">{formatCompactCurrency(r.monthlyTax)}</span></div>
                                                            <div className="flex justify-between gap-1"><span>Effective Rate</span><span className="font-mono shrink-0">{r.effectiveTaxRate}%</span></div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* CARD 2: SLAB BREAKDOWN */}
                                <Card className="glass-card border-brand-surfaceBorder">
                                    <CardContent className="pt-5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">
                                            Tax Slab Breakdown — {res.recommendedRegime === "new" ? "New" : "Old"} Regime (Recommended)
                                        </p>
                                        {(() => {
                                            const r = res.recommendedRegime === "new" ? res.newRegime : res.oldRegime;
                                            return (
                                                <>
                                                    <SlabBar rows={r.slabBreakdown} taxableIncome={r.taxableIncome} />
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-xs text-left">
                                                            <thead className="text-[10px] uppercase text-muted-foreground border-b border-brand-surfaceBorder">
                                                                <tr><th className="pb-2">Slab</th><th className="pb-2 text-right">Income in Slab</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Tax</th></tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-brand-surfaceBorder/20">
                                                                {r.slabBreakdown.map((row, i) => (
                                                                    <tr key={i} className="hover:bg-brand-surface/20">
                                                                        <td className="py-1.5 text-foreground/80">{row.range}</td>
                                                                        <td className="py-1.5 text-right font-mono">{formatCurrency(row.taxableAmount)}</td>
                                                                        <td className="py-1.5 text-right">{row.rate}%</td>
                                                                        <td className="py-1.5 text-right font-mono">{formatCurrency(row.taxAmount)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                    <div className="mt-3 space-y-1 border-t border-brand-surfaceBorder pt-3 text-sm">
                                                        <LedgerRow label="Basic Tax" value={formatCurrency(r.basicTax)} />
                                                        {r.surcharge > 0 && <LedgerRow label="+ Surcharge" value={formatCurrency(r.surcharge)} red />}
                                                        {r.marginalRelief > 0 && <LedgerRow label="− Marginal Relief" value={`−${formatCurrency(r.marginalRelief)}`} green />}
                                                        <LedgerRow label="+ Education Cess (4%)" value={formatCurrency(r.educationCess)} />
                                                        {r.rebate87A > 0 && <LedgerRow label="− Section 87A Rebate" value={`−${formatCurrency(r.rebate87A)}`} green />}
                                                        <div className="border-t border-brand-surfaceBorder mt-2 pt-2">
                                                            <LedgerRow label="TOTAL TAX PAYABLE" value={formatCurrency(r.taxAfterRebate)} bold />
                                                        </div>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* CARD 3: STEP-BY-STEP COMPUTATION */}
                                <Card className="glass-card border-brand-surfaceBorder">
                                    <CardContent className="pt-5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4">Step-by-Step Income Computation</p>
                                        <div className="flex gap-1 mb-4">
                                            {(["old", "new"] as const).map(tab => (
                                                <button key={tab} onClick={() => setActiveTab(tab)}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === tab ? "bg-brand-gold text-black" : "bg-brand-surface text-muted-foreground hover:text-foreground"}`}>
                                                    {tab === "old" ? "Old Regime" : "New Regime"}
                                                </button>
                                            ))}
                                        </div>
                                        {(() => {
                                            const r: RegimeResult = res[`${activeTab}Regime`];
                                            const isOldTab = activeTab === "old";
                                            return (
                                                <div className="space-y-0 text-sm">
                                                    <LedgerRow label="Gross Salary" value={formatCurrency(r.grossSalary)} sub />
                                                    <LedgerRow label={`– Standard Deduction (₹${(r.standardDeduction / 1000).toFixed(0)}K)`} value={`–${formatCurrency(r.standardDeduction)}`} sub green />
                                                    {isOldTab && r.hraExemption > 0 && <LedgerRow label="– HRA Exemption" value={`–${formatCurrency(r.hraExemption)}`} sub green />}
                                                    {!isOldTab && <LedgerRow label="– HRA Exemption" value="N/A (New Regime)" sub strike />}
                                                    {isOldTab && r.homeLoanDeductionSelfOccupied > 0 && <LedgerRow label="– Home Loan Interest (Self-Occ)" value={`–${formatCurrency(r.homeLoanDeductionSelfOccupied)}`} sub green />}
                                                    <LedgerRow label="Net Salary Income" value={formatCurrency(r.netSalaryIncome)} />
                                                    {r.otherIncome > 0 && <LedgerRow label="+ Other Income" value={formatCurrency(r.otherIncome)} sub />}
                                                    {r.interestIncome > 0 && <LedgerRow label="+ Interest Income" value={formatCurrency(r.interestIncome)} sub />}
                                                    {r.netRentalIncome > 0 && <LedgerRow label="+ Net Rental Income (Rental – Let-out Loan)" value={formatCurrency(r.netRentalIncome)} sub />}
                                                    <LedgerRow label="Gross Total Income" value={formatCurrency(r.grossTotalIncome)} bold />

                                                    <div className="mt-3 pt-2 border-t border-brand-surfaceBorder/30">
                                                        {isOldTab ? (
                                                            <>
                                                                {r.deduction80C > 0 && <LedgerRow label="– 80C (max ₹1.5L)" value={`–${formatCurrency(r.deduction80C)}`} sub green />}
                                                                {r.deduction80CCD1B > 0 && <LedgerRow label="– 80CCD(1B) NPS" value={`–${formatCurrency(r.deduction80CCD1B)}`} sub green />}
                                                                {r.deduction80D > 0 && <LedgerRow label="– 80D Medical Insurance" value={`–${formatCurrency(r.deduction80D)}`} sub green />}
                                                                {r.deduction80G > 0 && <LedgerRow label="– 80G Charity (50%)" value={`–${formatCurrency(r.deduction80G)}`} sub green />}
                                                                {r.deduction80E > 0 && <LedgerRow label="– 80E Education Loan" value={`–${formatCurrency(r.deduction80E)}`} sub green />}
                                                                {r.deduction80TTA_TTB > 0 && <LedgerRow label="– 80TTA/TTB Savings Interest" value={`–${formatCurrency(r.deduction80TTA_TTB)}`} sub green />}
                                                                {r.totalDeductions === 0 && <p className="text-[11px] text-muted-foreground/60 italic py-1">No additional deductions entered</p>}
                                                            </>
                                                        ) : (
                                                            <>
                                                                {r.deduction80CCD1B > 0 && <LedgerRow label="– 80CCD(1B) NPS (allowed)" value={`–${formatCurrency(r.deduction80CCD1B)}`} sub green />}
                                                                <p className="text-[10px] text-muted-foreground/50 italic py-1">80C, 80D, HRA etc. — not applicable in New Regime</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <LedgerRow label="TAXABLE INCOME" value={formatCurrency(r.taxableIncome)} bold />

                                                    <div className="mt-3 pt-2 border-t border-brand-surfaceBorder/30">
                                                        <LedgerRow label="Basic Tax (from slabs)" value={formatCurrency(r.basicTax)} />
                                                        {r.surcharge > 0 && <LedgerRow label="+ Surcharge" value={formatCurrency(r.surcharge)} red />}
                                                        {r.marginalRelief > 0 && <LedgerRow label="– Marginal Relief" value={`–${formatCurrency(r.marginalRelief)}`} green />}
                                                        <LedgerRow label="+ Education Cess (4%)" value={`+${formatCurrency(r.educationCess)}`} />
                                                        {r.rebate87A > 0 && <LedgerRow label="– Section 87A Rebate" value={`–${formatCurrency(r.rebate87A)}`} green />}
                                                    </div>
                                                    <LedgerRow label="TOTAL TAX PAYABLE" value={formatCurrency(r.taxAfterRebate)} bold />
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>

                                {/* CARD 4: HRA BREAKDOWN */}
                                {vals.hraReceived > 0 && vals.rentPaid > 0 && vals.basicSalary > 0 && (
                                    <Card className="glass-card border-brand-surfaceBorder">
                                        <CardContent className="pt-5">
                                            <p className="text-xs text-brand-success uppercase tracking-wider font-bold mb-4">HRA Exemption Breakdown (Old Regime)</p>
                                            <p className="text-xs text-muted-foreground mb-3">HRA Exemption = Minimum of the three values below:</p>
                                            <div className="space-y-0 text-sm">
                                                <LedgerRow label="a) Actual HRA Received" value={formatCurrency(res.hraComponents.actualHRA)} />
                                                <LedgerRow label="b) Rent Paid − 10% of (Basic + DA)" value={formatCurrency(Math.max(0, res.hraComponents.rentMinus10Percent))} />
                                                <LedgerRow label={`c) ${vals.isMetroCity ? "50%" : "40%"} of (Basic + DA) (${vals.isMetroCity ? "Metro" : "Non-Metro"})`} value={formatCurrency(res.hraComponents.percentOfBasicPlusDA)} />
                                                <div className="border-t border-brand-surfaceBorder mt-2 pt-2">
                                                    <LedgerRow label="HRA Exemption Applied ✓" value={formatCurrency(res.hraExemption)} bold green />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* CARD 5: SMART TAX INSIGHTS */}
                                <Card className="glass-card border-brand-surfaceBorder">
                                    <CardContent className="pt-5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5" /> Smart Tax Insights
                                        </p>
                                        <div className="space-y-3 text-sm">
                                            {/* Regime recommendation */}
                                            <div className="flex gap-3 p-3 rounded-lg bg-brand-success/5 border border-brand-success/20">
                                                <span className="text-lg shrink-0">💡</span>
                                                <p className="text-foreground/80 leading-relaxed">
                                                    <span className="font-bold capitalize">{res.recommendedRegime === "new" ? "New" : "Old"} Regime</span> saves you <span className="text-brand-success font-bold">{formatCurrency(res.taxSavedByChoosingBetter)}</span> in taxes this year.
                                                </p>
                                            </div>

                                            {/* Zero tax AY2627 new regime */}
                                            {res.newRegime.rebate87A > 0 && vals.assessmentYear === "AY2026-27" && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-brand-gold/5 border border-brand-gold/20">
                                                    <span className="text-lg shrink-0">✅</span>
                                                    <p className="text-foreground/80 leading-relaxed">
                                                        <span className="text-brand-gold font-bold">Zero Tax!</span> Full Section 87A rebate of ₹60,000 applies. Your {formatCompactCurrency(res.newRegime.grossSalary)} income is completely tax-free under the New Regime.
                                                    </p>
                                                </div>
                                            )}

                                            {/* 80C not maxed (old useful) */}
                                            {vals.section80C < 150000 && vals.grossSalary > 0 && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50">
                                                    <span className="text-lg shrink-0">💡</span>
                                                    <p className="text-foreground/80 leading-relaxed">
                                                        You&apos;ve used only <span className="font-bold">{formatCurrency(vals.section80C)}</span> of your ₹1,50,000 Section 80C limit. Investing <span className="text-brand-gold font-bold">{formatCurrency(150000 - (vals.section80C || 0))}</span> more in ELSS/PPF/LIC can save up to <span className="text-brand-success font-bold">{formatCurrency(Math.round((150000 - (vals.section80C || 0)) * (res.oldRegime.marginalTaxRate / 100) * 1.04))}</span> in Old Regime tax.
                                                    </p>
                                                </div>
                                            )}

                                            {/* NPS not used */}
                                            {!vals.section80CCD1B && vals.grossSalary > 0 && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50">
                                                    <span className="text-lg shrink-0">💡</span>
                                                    <p className="text-foreground/80 leading-relaxed">
                                                        Investing <span className="text-brand-gold font-bold">₹50,000</span> in NPS under 80CCD(1B) is allowed in <span className="font-bold">both regimes</span> and saves additional tax of ~<span className="text-brand-success font-bold">{formatCurrency(Math.round(50000 * (res.recommendedRegime === "new" ? res.newRegime.marginalTaxRate : res.oldRegime.marginalTaxRate) / 100 * 1.04))}</span>.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Surcharge warning */}
                                            {(res.oldRegime.surcharge > 0 || res.newRegime.surcharge > 0) && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-brand-danger/5 border border-brand-danger/20">
                                                    <AlertTriangle className="w-5 h-5 text-brand-danger shrink-0 mt-0.5" />
                                                    <p className="text-foreground/80 leading-relaxed">
                                                        Your income attracts a <span className="text-brand-danger font-bold">surcharge</span>. Consider tax-saving instruments to bring taxable income below ₹50,00,000.
                                                    </p>
                                                </div>
                                            )}

                                            {/* New regime wins despite deductions */}
                                            {res.recommendedRegime === "new" && res.oldRegime.totalDeductions > 0 && (
                                                <div className="flex gap-3 p-3 rounded-lg bg-brand-surface/40 border border-brand-surfaceBorder/50">
                                                    <span className="text-lg shrink-0">💡</span>
                                                    <p className="text-foreground/80 leading-relaxed">
                                                        Even with your deductions of <span className="font-bold">{formatCurrency(res.oldRegime.totalDeductions + res.oldRegime.hraExemption)}</span>, the New Regime&apos;s higher ₹4L basic exemption and ₹60,000 rebate result in <span className="text-brand-success font-bold">{formatCurrency(res.taxSavedByChoosingBetter)}</span> less tax.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Recalculate */}
                                <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                                    className="w-full py-3 rounded-xl border border-brand-surfaceBorder text-sm font-medium text-muted-foreground hover:text-foreground hover:border-brand-gold/50 transition-all">
                                    ↑ Recalculate — Go back to inputs
                                </button>

                                {/* Disclaimer */}
                                <p className="text-[11px] text-center text-muted-foreground opacity-50 px-4 leading-relaxed">
                                    Tax figures are based on official rates for AY 2026-27 (FY 2025-26) as per Union Budget 2025.
                                    New regime 87A rebate of ₹60,000, revised tax slabs, surcharge, marginal relief, and regime-specific
                                    deduction restrictions are all applied as per CBDT guidelines. This calculator is for educational purposes
                                    only. Please consult a Chartered Accountant for personalised tax advice.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
