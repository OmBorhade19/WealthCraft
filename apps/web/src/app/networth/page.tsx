"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Trash2, Plus } from "lucide-react";
import { calculateNetworth } from "@wealthcraft/financial-engine";
import { formatCompactCurrency } from "@/lib/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const numSchema = z.union([z.coerce.number().min(0), z.literal('')]).optional().default('');

// Zod schema for assets & liabilities
const schema = z.object({
    financialAssets: z.object({
        banks: z.array(z.object({
            name: z.string().optional(),
            amount: numSchema
        })),
        mutualFunds: numSchema,
        equityETFs: numSchema,
        bondsSGBs: numSchema,
        insurance: numSchema,
        ppfEpfNps: numSchema,
        otherInvestments: numSchema,
    }),
    physicalAssets: z.object({
        property: numSchema,
        goldJewellery: numSchema,
        vehicles: numSchema,
        otherAssets: numSchema,
    }),
    liabilities: z.object({
        homeLoan: numSchema,
        carLoan: numSchema,
        educationLoan: numSchema,
        personalOtherLoans: numSchema,
        creditCards: numSchema,
    })
});

const COLORS = ['#3B82F6', '#F5A623', '#10B981', '#8B5CF6', '#EC4899', '#6B7FA3'];

function InputRow({ label, name, form }: { label: string, name: string, form: any }) {
    return (
        <div className="flex items-center justify-between pb-3 border-b border-brand-surfaceBorder/50 last:border-0 last:pb-0">
            <label className="text-sm font-medium text-muted-foreground leading-snug pr-2">{label}</label>
            <div className="relative w-32 shrink-0">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">₹</span>
                <Controller
                    name={name}
                    control={form.control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            type="text"
                            inputMode="numeric"
                            placeholder="Amount"
                            value={field.value !== undefined && field.value !== "" ? Number(String(field.value).replace(/,/g, '')).toLocaleString('en-IN') : ""}
                            onChange={(e) => {
                                const rawValue = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                                field.onChange(rawValue ? Number(rawValue) : "");
                            }}
                            className="pl-6 h-9 bg-brand-darkBg/50 border-brand-surfaceBorder font-mono focus-visible:ring-brand-gold text-right text-sm"
                        />
                    )}
                />
            </div>
        </div>
    );
}

function BankRow({ index, form, remove }: { index: number, form: any, remove: (idx: number) => void }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 pt-1 border-b border-brand-surfaceBorder/50 last:border-0 last:pb-0 gap-3">
            <Controller
                name={`financialAssets.banks.${index}.name`}
                control={form.control}
                render={({ field }) => (
                    <Input
                        {...field}
                        className="h-9 bg-transparent border-brand-surfaceBorder/50 focus-visible:ring-1 focus-visible:ring-brand-gold font-medium text-sm text-foreground w-full sm:max-w-[180px]"
                        placeholder="Bank Name"
                    />
                )}
            />
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="relative w-32 shrink-0">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">₹</span>
                    <Controller
                        name={`financialAssets.banks.${index}.amount`}
                        control={form.control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                type="text"
                                inputMode="numeric"
                                placeholder="Amount"
                                value={field.value !== undefined && field.value !== "" ? Number(String(field.value).replace(/,/g, '')).toLocaleString('en-IN') : ""}
                                onChange={(e) => {
                                    const rawValue = e.target.value.replace(/,/g, '').replace(/[^\d]/g, '');
                                    field.onChange(rawValue ? Number(rawValue) : "");
                                }}
                                className="pl-6 h-9 bg-brand-darkBg/50 border-brand-surfaceBorder font-mono focus-visible:ring-brand-gold text-right text-sm"
                            />
                        )}
                    />
                </div>
                <button type="button" onClick={() => remove(index)} className="text-muted-foreground hover:text-brand-danger transition-colors p-1.5" title="Remove Bank">
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function TotalRow({ label, amount, highlight = false }: { label: string, amount: number, highlight?: boolean }) {
    return (
        <div className={`flex items-center justify-between py-4 px-4 rounded-md mt-4 ${highlight ? 'bg-brand-surface border border-brand-gold/50 shadow-sm' : 'bg-brand-surfaceBorder/20'}`}>
            <span className={`text-sm ${highlight ? 'font-bold text-brand-gold uppercase tracking-wider' : 'font-semibold text-foreground'}`}>{label}</span>
            <span className={`font-mono ${highlight ? 'text-lg font-bold text-brand-gold' : 'font-semibold text-brand-gold'}`}>
                ₹{amount.toLocaleString('en-IN')}
            </span>
        </div>
    );
}

const safeNum = (val: any) => val ? Number(val) : 0;

export default function NetworthPage() {
    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            financialAssets: {
                banks: [
                    { name: 'ICICI Bank', amount: "" },
                    { name: 'HDFC Bank', amount: "" }
                ],
                mutualFunds: "", equityETFs: "", bondsSGBs: "", insurance: "", ppfEpfNps: "", otherInvestments: ""
            },
            physicalAssets: {
                property: "", goldJewellery: "", vehicles: "", otherAssets: ""
            },
            liabilities: {
                homeLoan: "", carLoan: "", educationLoan: "", personalOtherLoans: "", creditCards: ""
            }
        },
    });

    const { fields: bankFields, append: appendBank, remove: removeBank } = useFieldArray({
        control: form.control,
        name: "financialAssets.banks",
    });

    const vals = form.watch();

    const totalBankBalance = (vals.financialAssets?.banks || []).reduce((acc, b) => acc + safeNum(b.amount), 0);
    const totalFinancialAssets = totalBankBalance + safeNum(vals.financialAssets?.mutualFunds) + safeNum(vals.financialAssets?.equityETFs) + safeNum(vals.financialAssets?.bondsSGBs) + safeNum(vals.financialAssets?.insurance) + safeNum(vals.financialAssets?.ppfEpfNps) + safeNum(vals.financialAssets?.otherInvestments);
    const totalPhysicalAssets = safeNum(vals.physicalAssets?.property) + safeNum(vals.physicalAssets?.goldJewellery) + safeNum(vals.physicalAssets?.vehicles) + safeNum(vals.physicalAssets?.otherAssets);

    // Engine Mapping
    const engineAssets = {
        savings: totalBankBalance,
        fixedDeposits: 0,
        cash: 0,
        mutualFunds: safeNum(vals.financialAssets?.mutualFunds),
        stocks: safeNum(vals.financialAssets?.equityETFs),
        ppf: safeNum(vals.financialAssets?.ppfEpfNps),
        epf: 0,
        nps: 0,
        gold: safeNum(vals.physicalAssets?.goldJewellery),
        crypto: 0,
        otherInvestments: safeNum(vals.financialAssets?.bondsSGBs) + safeNum(vals.financialAssets?.insurance) + safeNum(vals.financialAssets?.otherInvestments),
        primaryHome: safeNum(vals.physicalAssets?.property),
        otherRealEstate: 0,
        otherAssets: safeNum(vals.physicalAssets?.vehicles) + safeNum(vals.physicalAssets?.otherAssets),
    };

    const engineLiabilities = {
        homeLoan: safeNum(vals.liabilities?.homeLoan),
        carLoan: safeNum(vals.liabilities?.carLoan),
        personalLoan: safeNum(vals.liabilities?.educationLoan) + safeNum(vals.liabilities?.personalOtherLoans),
        creditCardDues: safeNum(vals.liabilities?.creditCards),
        otherLiabilities: 0
    };

    const res = calculateNetworth(engineAssets as any, engineLiabilities as any);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-foreground">Networth Tracker</h1>
                    <p className="text-muted-foreground mt-2">Map your assets against liabilities to find your true wealth.</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Col - Data Entry */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

                        {/* Assets */}
                        <Card className="glass-card border-brand-surfaceBorder border-t-4 border-t-brand-success">
                            <CardContent className="pt-6">
                                <div className="mb-6 border-b border-brand-surfaceBorder/50 pb-4">
                                    <h3 className="text-xs font-semibold text-brand-gold uppercase tracking-widest mb-1">ASSETS</h3>
                                    <h2 className="text-xl font-heading font-bold text-foreground">Total Assets Portfolio</h2>
                                </div>

                                <div className="space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                                    {/* Financial Assets */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground border-b border-brand-surfaceBorder/30 pb-2 mb-4">Financial Assets</h4>
                                        <div className="space-y-3">
                                            {bankFields.map((field, index) => (
                                                <BankRow key={field.id} index={index} form={form} remove={removeBank} />
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => appendBank({ name: "", amount: "" as any })}
                                                className="flex items-center gap-1 text-xs font-medium text-brand-gold hover:text-brand-gold/80 transition-colors py-1 mb-2"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Add Bank
                                            </button>

                                            <InputRow label="Mutual Funds" name="financialAssets.mutualFunds" form={form} />
                                            <InputRow label="Equity / ETFs" name="financialAssets.equityETFs" form={form} />
                                            <InputRow label="Bonds / SGBs" name="financialAssets.bondsSGBs" form={form} />
                                            <InputRow label="Insurance (Cash Value)" name="financialAssets.insurance" form={form} />
                                            <InputRow label="PPF / EPF / NPS" name="financialAssets.ppfEpfNps" form={form} />
                                            <InputRow label="Other Investments" name="financialAssets.otherInvestments" form={form} />
                                        </div>
                                        <TotalRow label="Total Financial Assets" amount={totalFinancialAssets} />
                                    </div>

                                    {/* Physical Assets */}
                                    <div className="pt-4">
                                        <h4 className="text-sm font-semibold text-foreground border-b border-brand-surfaceBorder/30 pb-2 mb-4">Physical Assets</h4>
                                        <div className="space-y-3">
                                            <InputRow label="Property" name="physicalAssets.property" form={form} />
                                            <InputRow label="Gold / Jewellery" name="physicalAssets.goldJewellery" form={form} />
                                            <InputRow label="Vehicles" name="physicalAssets.vehicles" form={form} />
                                            <InputRow label="Other Assets" name="physicalAssets.otherAssets" form={form} />
                                        </div>
                                        <TotalRow label="Total Physical Assets" amount={totalPhysicalAssets} />
                                    </div>

                                    <div className="pt-2">
                                        <TotalRow label="TOTAL ASSETS" amount={res.totalAssets} highlight={true} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Liabilities */}
                        <Card className="glass-card border-brand-surfaceBorder border-t-4 border-t-brand-danger">
                            <CardContent className="pt-6">
                                <div className="mb-6 border-b border-brand-surfaceBorder/50 pb-4">
                                    <h3 className="text-xs font-semibold text-brand-gold uppercase tracking-widest mb-1">LIABILITIES</h3>
                                    <h2 className="text-xl font-heading font-bold text-foreground">Outstanding Debt</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <InputRow label="Home Loan" name="liabilities.homeLoan" form={form} />
                                        <InputRow label="Car Loan" name="liabilities.carLoan" form={form} />
                                        <InputRow label="Education Loan" name="liabilities.educationLoan" form={form} />
                                        <InputRow label="Personal / Other Loans" name="liabilities.personalOtherLoans" form={form} />
                                        <InputRow label="Credit Cards" name="liabilities.creditCards" form={form} />
                                    </div>
                                    <TotalRow label="TOTAL LIABILITIES" amount={res.totalLiabilities} highlight={true} />
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </motion.div>

                {/* Right Col - Dashboard */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-4 space-y-6">

                    <div className="glass-card p-6 rounded-xl border border-brand-surfaceBorder relative overflow-hidden text-center shadow-2xl">
                        <div className={`absolute inset-0 opacity-10 ${res.networth >= 0 ? 'bg-brand-success' : 'bg-brand-danger'}`} />
                        <p className="text-muted-foreground text-sm font-medium mb-1 uppercase tracking-widest relative z-10">Total Networth</p>
                        <h2 className={`text-4xl md:text-5xl font-heading font-bold tracking-tight mt-2 mb-2 relative z-10 ${res.networth >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                            {formatCompactCurrency(res.networth)}
                        </h2>
                        <div className="h-0.5 w-12 mx-auto bg-brand-surfaceBorder mt-4 mb-3 relative z-10" />
                        <p className="text-xs text-muted-foreground relative z-10">
                            Total Assets minus Total Liabilities
                        </p>
                    </div>

                    <Card className="glass-card border-brand-surfaceBorder">
                        <CardContent className="pt-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider text-center">Asset Allocation</h3>
                            <div className="w-full h-[250px]">
                                {res.totalAssets > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={res.assetAllocation}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="amount"
                                                stroke="none"
                                            >
                                                {res.assetAllocation.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="glass-tooltip flex flex-col gap-1 min-w-[150px]">
                                                                <p className="font-medium text-white text-sm">{data.category}</p>
                                                                <p className="font-mono font-bold text-brand-gold">{formatCompactCurrency(data.amount)}</p>
                                                                <p className="text-xs text-muted-foreground">{data.percentage.toFixed(1)}% of assets</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                                        <PieChart className="w-12 h-12 mb-2 opacity-20" />
                                        No assets to allocate
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-2">
                                {res.assetAllocation.map((item, idx) => (
                                    <div key={item.category} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-muted-foreground">{item.category}</span>
                                        </div>
                                        <span className="font-mono text-foreground font-medium">{item.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                </motion.div>
            </div>
        </div>
    );
}

