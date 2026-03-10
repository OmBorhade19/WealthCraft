"use client";

import React, { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import {
    PieChart, Pie, Cell,
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
    calculateBudget,
} from "@wealthcraft/financial-engine";
import { formatCurrency, formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    AlertCircle, CheckCircle2, Lightbulb, AlertTriangle,
    Wallet, TrendingDown, PiggyBank, Target
} from "lucide-react";
import Link from "next/link";

// Zod Schemas
const incomeSchema = z.object({
    salary: z.number().min(0).optional(),
    salary2: z.number().min(0).optional(),
    otherIncome: z.number().min(0).optional(),
});

const expenseSchema = z.object({
    householdExp: z.number().min(0).optional(),
    rent: z.number().min(0).optional(),
    emi: z.number().min(0).optional(),
    healthInsurance: z.number().min(0).optional(),
    insurance: z.number().min(0).optional(),
    bills: z.number().min(0).optional(),
    schoolFees: z.number().min(0).optional(),
    fuel: z.number().min(0).optional(),
    personal: z.number().min(0).optional(),
    existingSIP: z.number().min(0).optional(),
    additionalExpenses: z.number().min(0).optional(),
});

const formSchema = z.object({
    income: incomeSchema,
    expenses: expenseSchema
});

const COLORS = ['#F5A623', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#A855F7'];

export default function FinancialPlanningPage() {
    const printRef = useRef<HTMLDivElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            income: { salary: undefined, salary2: undefined, otherIncome: undefined },
            expenses: {
                householdExp: undefined, rent: undefined, emi: undefined, healthInsurance: undefined,
                insurance: undefined, bills: undefined, schoolFees: undefined, fuel: undefined,
                personal: undefined, existingSIP: undefined, additionalExpenses: undefined
            }
        }
    });

    const formData = form.watch();
    const budget = calculateBudget(formData.income, formData.expenses);



    const resetForm = () => {
        form.reset({
            income: { salary: undefined, salary2: undefined, otherIncome: undefined },
            expenses: {
                householdExp: undefined, rent: undefined, emi: undefined, healthInsurance: undefined,
                insurance: undefined, bills: undefined, schoolFees: undefined, fuel: undefined,
                personal: undefined, existingSIP: undefined, additionalExpenses: undefined
            }
        });
    };

    const renderField = (label: string, fieldPath: any, placeholderText?: string) => (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">{label}</label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
                <Input
                    type="text"
                    inputMode="numeric"
                    placeholder={placeholderText}
                    className="pl-8 bg-brand-surface/30 border-brand-surfaceBorder focus:border-brand-gold/50"
                    {...form.register(fieldPath, {
                        onChange: (e) => {
                            const target = e.target as HTMLInputElement;
                            const rawValue = target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                            target.value = rawValue ? Number(rawValue).toLocaleString('en-IN') : '';
                        },
                        setValueAs: (v) => {
                            if (v === "" || v === undefined) return undefined;
                            const num = Number(String(v).replace(/,/g, ''));
                            return isNaN(num) ? undefined : num;
                        }
                    })}
                />
            </div>
        </div>
    );

    const pieData = budget.expenseBreakdown.filter(item => item.amount > 0).map((item, index) => ({
        name: item.category,
        value: item.amount,
    }));

    const barData = [
        { name: "Income", amount: budget.totalIncome, fill: "#F5A623" },
        { name: "Expenses", amount: budget.totalExpenses, fill: "#3B82F6" },
    ];
    if (budget.balance !== 0) {
        barData.push({ name: "Balance", amount: budget.balance, fill: budget.balance >= 0 ? "#10B981" : "#EF4444" });
    }

    // Health Score Glow Logic
    let glowColor = "shadow-red-500/50";
    let textColor = "text-red-500";
    let healthLabel = "Critical";
    if (budget.healthScore >= 80) { glowColor = "shadow-emerald-500/50"; textColor = "text-emerald-500"; healthLabel = "Excellent"; }
    else if (budget.healthScore >= 60) { glowColor = "shadow-blue-500/50"; textColor = "text-blue-500"; healthLabel = "Good"; }
    else if (budget.healthScore >= 40) { glowColor = "shadow-amber-500/50"; textColor = "text-amber-500"; healthLabel = "Needs Improvement"; }

    return (
        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full min-h-screen" ref={printRef}>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Do Your Financial Planning</h1>
                    <p className="text-muted-foreground mt-2">Map your income, track expenses, and get personalized wealth insights.</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">

                {/* LEFT COLUMN: Input Panel (40%) */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-2 space-y-6">

                    {/* INCOME CARD */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="p-6">
                            <div className="uppercase tracking-wider text-xs font-bold text-brand-gold mb-4 flex items-center gap-2"><Wallet size={16} /> INCOME</div>
                            <div className="space-y-4">
                                {renderField("Salary (Primary)", "income.salary", "e.g., 50000")}
                                {renderField("Salary 2 / Spouse Income", "income.salary2", "e.g., 30000")}
                                {renderField("Other Income", "income.otherIncome", "e.g., 5000")}
                            </div>
                            <div className="mt-6 pt-4 border-t border-brand-surfaceBorder flex justify-between items-center">
                                <span className="font-semibold text-muted-foreground">Total Monthly Income</span>
                                <span className="font-mono text-xl font-bold text-brand-gold">{formatCurrency(budget.totalIncome)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* EXPENSES CARD */}
                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="p-6">
                            <div className="uppercase tracking-wider text-xs font-bold text-brand-blue mb-4 flex items-center gap-2"><TrendingDown size={16} /> EXPENSES</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {renderField("Household Expenses", "expenses.householdExp", "e.g., 10000")}
                                {renderField("Rent / Housing", "expenses.rent", "e.g., 15000")}
                                {renderField("EMI / Loans", "expenses.emi", "e.g., 8000")}
                                {renderField("Existing SIP", "expenses.existingSIP", "e.g., 5000")}
                                {renderField("Health Insurance", "expenses.healthInsurance", "e.g., 2000")}
                                {renderField("Life/Other Insurance", "expenses.insurance", "e.g., 1500")}
                                {renderField("Bills & Utilities", "expenses.bills", "e.g., 3000")}
                                {renderField("School / Education", "expenses.schoolFees", "e.g., 7000")}
                                {renderField("Fuel & Transport", "expenses.fuel", "e.g., 2500")}
                                {renderField("Personal Expenses", "expenses.personal", "e.g., 4000")}
                                {renderField("Additional Expenses", "expenses.additionalExpenses", "e.g., 1000")}
                            </div>

                            <div className="mt-6 pt-4 border-t border-brand-surfaceBorder space-y-3">
                                <div className="flex justify-between items-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    <span className="font-semibold text-red-200">Total Monthly Expenses</span>
                                    <span className="font-mono text-xl font-bold text-red-400">{formatCurrency(budget.totalExpenses)}</span>
                                </div>

                                <div className={`flex justify-between items-center p-3 rounded-lg border ${budget.balance >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                    <span className={`font-semibold ${budget.balance >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>Monthly Balance</span>
                                    <span className={`font-mono text-xl font-bold ${budget.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {budget.balance >= 0 ? '+' : ''}{formatCurrency(budget.balance)}
                                    </span>
                                </div>
                            </div>

                            <button onClick={resetForm} className="w-full mt-6 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-brand-surfaceBorder rounded-md">
                                Reset All Fields
                            </button>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* RIGHT COLUMN: Live Analysis Dashboard (60%) */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-3 space-y-6">
                    {(budget.totalIncome === 0 && budget.totalExpenses === 0) ? (
                        <div className="h-full min-h-[500px] flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-brand-surfaceBorder/50 bg-brand-surface/10">
                            <div className="p-4 rounded-full bg-brand-surface/30 mb-6 shadow-xl shadow-brand-gold/5">
                                <Target size={48} className="text-brand-gold/50" />
                            </div>
                            <h3 className="text-2xl font-bold font-heading text-foreground mb-3">Welcome to Financial Planning</h3>
                            <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                                Enter your monthly income and expenses on the left to instantly see a comprehensive breakdown of your cashflow, health score, and personalized savings insights.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Section A: Summary Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Card className="glass-card border-brand-surfaceBorder"><CardContent className="p-4 flex flex-col justify-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Income</p>
                                    <p className="text-xl font-mono font-bold text-brand-gold">{formatCompactCurrency(budget.totalIncome)}</p>
                                </CardContent></Card>
                                <Card className="glass-card border-brand-surfaceBorder bg-red-500/5"><CardContent className="p-4 flex flex-col justify-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Expenses</p>
                                    <p className="text-xl font-mono font-bold text-red-400">{formatCompactCurrency(budget.totalExpenses)}</p>
                                </CardContent></Card>
                                <Card className={`glass-card border-brand-surfaceBorder ${budget.balance >= 0 ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}><CardContent className="p-4 flex flex-col justify-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Monthly Balance</p>
                                    <p className={`text-xl font-mono font-bold ${budget.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatCompactCurrency(budget.balance)}</p>
                                </CardContent></Card>
                                <Card className="glass-card border-brand-surfaceBorder"><CardContent className="p-4 flex flex-col justify-center items-center text-center relative overflow-hidden">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider z-10 mb-1">Savings Rate</p>
                                    <p className="text-xl font-mono font-bold text-brand-teal z-10">{budget.savingsRate.toFixed(1)}%</p>
                                    {/* Progress Ring BG */}
                                    <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                                        <svg className="w-20 h-20 transform -rotate-90">
                                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-brand-surfaceBorder" />
                                            <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-brand-teal" strokeDasharray={`${budget.savingsRate * 2.26} 226`} />
                                        </svg>
                                    </div>
                                </CardContent></Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Section E: Financial Health Score */}
                                <Card className="glass-card border-brand-surfaceBorder relative overflow-hidden flex flex-col items-center justify-center p-8">
                                    <h3 className="absolute top-4 left-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Financial Health</h3>

                                    <div className={`relative flex items-center justify-center w-48 h-48 rounded-full rounded-full shadow-2xl ${glowColor} mt-4`}>
                                        <svg className="w-full h-full transform -rotate-90">
                                            <circle cx="96" cy="96" r="88" strokeWidth="12" fill="none" className="stroke-brand-surfaceBorder" />
                                            <motion.circle
                                                initial={{ strokeDasharray: "0 553" }}
                                                animate={{ strokeDasharray: `${(budget.healthScore / 100) * 553} 553` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                                cx="96" cy="96" r="88" strokeWidth="12" fill="none" strokeLinecap="round" className={`stroke-current ${textColor}`}
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center text-center">
                                            <span className={`text-5xl font-mono font-bold ${textColor}`}>{budget.healthScore}</span>
                                            <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">out of 100</span>
                                        </div>
                                    </div>
                                    <p className={`mt-6 font-semibold text-lg ${textColor}`}>{healthLabel}</p>
                                </Card>

                                {/* Section C: Income vs Expenses */}
                                <Card className="glass-card border-brand-surfaceBorder p-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Cashflow Overview</h3>
                                    <div className="h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#080C14', borderColor: '#1F2937', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                                                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                                    {barData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </div>

                            {/* Section B & D: Breakdown & Table */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="glass-card border-brand-surfaceBorder p-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Expense Breakdown</h3>
                                    {pieData.length > 0 ? (
                                        <div className="h-[280px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={pieData} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#080C14', borderColor: '#1F2937', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(val: any) => `₹${Number(val).toLocaleString()}`} />
                                                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No expenses logged yet</div>
                                    )}
                                </Card>

                                <Card className="glass-card border-brand-surfaceBorder overflow-hidden flex flex-col">
                                    <div className="p-4 border-b border-brand-surfaceBorder/50">
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Budget Analysis</h3>
                                    </div>
                                    <div className="overflow-y-auto max-h-[280px] p-0 custom-scrollbar">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-brand-surface/50 text-xs uppercase text-muted-foreground sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Category</th>
                                                    <th className="px-4 py-3 font-medium">Amount</th>
                                                    <th className="px-4 py-3 font-medium">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-brand-surfaceBorder/30">
                                                {budget.expenseBreakdown.filter(i => i.amount > 0).sort((a, b) => b.amount - a.amount).map((item, i) => (
                                                    <tr key={i} className="hover:bg-brand-surface/20 transition-colors">
                                                        <td className="px-4 py-3 text-foreground">{item.category}</td>
                                                        <td className="px-4 py-3 font-mono">₹{item.amount.toLocaleString()}</td>
                                                        <td className="px-4 py-3">
                                                            {item.status === 'healthy' && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] uppercase rounded-full border border-emerald-500/20">Healthy ({item.percentOfIncome}%)</span>}
                                                            {item.status === 'high' && <span className="px-2 py-1 bg-amber-500/10 text-amber-500 text-[10px] uppercase rounded-full border border-amber-500/20">High ({item.percentOfIncome}%)</span>}
                                                            {item.status === 'critical' && <span className="px-2 py-1 bg-red-500/10 text-red-400 text-[10px] uppercase rounded-full border border-red-500/20">Critical ({item.percentOfIncome}%)</span>}
                                                            {item.status === 'low' && <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-[10px] uppercase rounded-full border border-blue-500/20">Low ({item.percentOfIncome}%)</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                                {budget.expenseBreakdown.filter(i => i.amount > 0).length === 0 && (
                                                    <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No data to display</td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>

                            {/* Section F: Insights & SIP Recommendation*/}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="glass-card border-brand-surfaceBorder lg:col-span-2 p-5 flex flex-col gap-4">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Lightbulb size={16} className="text-brand-gold" /> Your Financial Insights
                                    </h3>
                                    <div className="space-y-3">
                                        {budget.insights.map((insight, i) => {
                                            let icon = <AlertCircle size={18} className="text-blue-400 mt-0.5 shrink-0" />;
                                            if (insight.type === 'success') icon = <CheckCircle2 size={18} className="text-emerald-400 mt-0.5 shrink-0" />;
                                            if (insight.type === 'warning') icon = <AlertTriangle size={18} className="text-amber-500 mt-0.5 shrink-0" />;
                                            if (insight.type === 'critical') icon = <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />;
                                            if (insight.type === 'tip') icon = <Lightbulb size={18} className="text-brand-gold mt-0.5 shrink-0" />;

                                            // Simple bolding of numbers logic
                                            const formattedMessage = insight.message.split(/(₹[\d,]+|[\d.]+%)/g).map((part, index) =>
                                                part.match(/(₹[\d,]+|[\d.]+%)/) ? <span key={index} className="font-bold text-foreground">{part}</span> : part
                                            );

                                            return (
                                                <div key={i} className="flex gap-3 text-sm text-foreground/80 bg-brand-surface/30 p-3 rounded-lg border border-brand-surfaceBorder/50 leading-relaxed">
                                                    {icon}
                                                    <p>{formattedMessage}</p>
                                                </div>
                                            );
                                        })}
                                        {budget.insights.length === 0 && (
                                            <p className="text-muted-foreground text-sm italic">Enter your income and expenses to unlock AI-powered insights.</p>
                                        )}
                                    </div>
                                </Card>

                                <Card className="glass-card border-brand-surfaceBorder bg-gradient-to-br from-brand-surface to-brand-gold/5 p-5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold uppercase tracking-wider text-brand-gold flex items-center gap-2 mb-4">
                                            <Target size={16} /> SIP Recommendation
                                        </h3>
                                        {budget.recommendedSIP > 0 ? (
                                            <>
                                                <p className="text-sm text-muted-foreground mb-1">Suggested Monthly SIP (30% of savings)</p>
                                                <p className="text-3xl font-mono font-bold text-foreground mb-4">₹{budget.recommendedSIP.toLocaleString()}</p>
                                                <div className="space-y-2 text-xs">
                                                    <div className="flex justify-between border-b border-brand-surfaceBorder/50 pb-1">
                                                        <span className="text-muted-foreground">In 10 Yrs @ 12%</span>
                                                        <span className="font-mono font-semibold text-emerald-400">₹{Math.round(budget.recommendedSIP * (((Math.pow(1.01, 120) - 1) / 0.01) * 1.01)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between pt-1">
                                                        <span className="text-muted-foreground">In 20 Yrs @ 12%</span>
                                                        <span className="font-mono font-semibold text-emerald-400">₹{Math.round(budget.recommendedSIP * (((Math.pow(1.01, 240) - 1) / 0.01) * 1.01)).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Reduce expenses to generate a positive balance to start investing!</p>
                                        )}
                                    </div>
                                    <Link href="/sip" className="mt-6 w-full block text-center py-2 bg-brand-gold text-white text-sm font-semibold rounded-md shadow-lg shadow-brand-gold/20 hover:bg-yellow-500 transition-colors">
                                        Calculate in SIP Calculator →
                                    </Link>
                                </Card>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* BOTTOM: Annual Projection */}
            <div className="mt-12">
                <Card className="glass-card border-brand-surfaceBorder overflow-hidden">
                    <CardContent className="p-0 flex flex-col">
                        <div className="p-6 border-b border-brand-surfaceBorder flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <PiggyBank className="text-brand-gold" size={20} />
                                <h2 className="text-lg font-heading font-semibold text-foreground">Annual Capital Projection</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                                <thead className="bg-brand-surface/50 text-xs uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-4 font-medium min-w-[120px]">Month</th>
                                        <th className="px-6 py-4 font-medium">Income</th>
                                        <th className="px-6 py-4 font-medium">Total Expenses</th>
                                        <th className="px-6 py-4 font-medium">Monthly Balance</th>
                                        <th className="px-6 py-4 font-medium text-brand-gold">Cumulative Savings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-brand-surfaceBorder/30">
                                    {budget.annualProjection.map((row, i) => (
                                        <tr key={i} className={`hover:bg-brand-surface/20 transition-colors ${i === 12 ? 'bg-brand-surface/40 font-bold border-t-2 border-brand-surfaceBorder' : ''}`}>
                                            <td className={`px-6 py-4 ${i === 12 ? 'text-brand-gold' : 'text-foreground'}`}>{row.month}</td>
                                            <td className="px-6 py-4 font-mono">₹{row.income.toLocaleString()}</td>
                                            <td className="px-6 py-4 font-mono text-red-400">₹{row.expenses.toLocaleString()}</td>
                                            <td className={`px-6 py-4 font-mono ${row.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {row.balance >= 0 ? '+' : ''}₹{row.balance.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-brand-gold">₹{row.cumulativeSavings.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
