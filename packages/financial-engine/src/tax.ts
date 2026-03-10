// ─── INCOME TAX ENGINE — FY 2025-26 (AY 2026-27) & FY 2024-25 (AY 2025-26) ───
// Source: Union Budget 2025, CBDT guidelines

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SlabConfig {
    min: number;
    max: number;
    rate: number;
}

export interface Rebate87AConfig {
    maxIncome: number;   // taxable income ceiling to qualify
    maxRebate: number;   // maximum rebate amount
}

export interface SlabRow {
    range: string;
    taxableAmount: number;
    rate: number;
    taxAmount: number;
}

export interface RegimeResult {
    // Income
    grossSalary: number;
    standardDeduction: number;
    hraExemption: number;
    homeLoanDeductionSelfOccupied: number;
    netSalaryIncome: number;
    otherIncome: number;
    interestIncome: number;
    netRentalIncome: number;
    grossTotalIncome: number;

    // Deductions
    deduction80C: number;
    deduction80CCD1B: number;
    deduction80D: number;
    deduction80G: number;
    deduction80E: number;
    deduction80TTA_TTB: number;
    totalDeductions: number;

    // Tax computation
    taxableIncome: number;
    basicTax: number;
    surcharge: number;
    marginalRelief: number;
    educationCess: number;
    grossTax: number;
    rebate87A: number;
    taxAfterRebate: number;

    // Summary
    monthlyTax: number;
    effectiveTaxRate: number;
    marginalTaxRate: number;
    slabBreakdown: SlabRow[];

    // Legacy compat
    oldRegimeSlabBreakdown: { slab: string; taxAmount: number }[];
    newRegimeSlabBreakdown: { slab: string; taxAmount: number }[];
}

export interface TaxInput {
    assessmentYear: 'AY2026-27' | 'AY2025-26';
    ageCategory: 'below60' | 'senior60to80' | 'superSeniorAbove80';

    // Income
    grossSalary: number;
    otherIncome: number;
    interestIncome: number;
    rentalIncome: number;
    homeLoanInterestSelfOccupied: number;
    homeLoanInterestLetOut: number;

    // Deductions (Old Regime)
    section80C: number;
    section80CCD1B: number;
    section80D: number;
    section80G: number;
    section80E: number;
    section80TTA_TTB: number;

    // HRA
    basicSalary: number;
    da: number;
    hraReceived: number;
    rentPaid: number;
    isMetroCity: boolean;
}

export interface TaxResult {
    oldRegime: RegimeResult;
    newRegime: RegimeResult;
    recommendedRegime: 'old' | 'new';
    taxSavedByChoosingBetter: number;
    hraExemption: number;
    hraComponents: {
        actualHRA: number;
        rentMinus10Percent: number;
        percentOfBasicPlusDA: number;
    };
}

// ─── SLAB CONFIGS ─────────────────────────────────────────────────────────────

const OLD_BELOW60_SLABS: SlabConfig[] = [
    { min: 0, max: 250000, rate: 0 },
    { min: 250000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const OLD_SENIOR_SLABS: SlabConfig[] = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 500000, rate: 5 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const OLD_SUPER_SENIOR_SLABS: SlabConfig[] = [
    { min: 0, max: 500000, rate: 0 },
    { min: 500000, max: 1000000, rate: 20 },
    { min: 1000000, max: Infinity, rate: 30 },
];

const NEW_AY2026_27_SLABS: SlabConfig[] = [
    { min: 0, max: 400000, rate: 0 },
    { min: 400000, max: 800000, rate: 5 },
    { min: 800000, max: 1200000, rate: 10 },
    { min: 1200000, max: 1600000, rate: 15 },
    { min: 1600000, max: 2000000, rate: 20 },
    { min: 2000000, max: 2400000, rate: 25 },
    { min: 2400000, max: Infinity, rate: 30 },
];

const NEW_AY2025_26_SLABS: SlabConfig[] = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 5 },
    { min: 700000, max: 1000000, rate: 10 },
    { min: 1000000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: Infinity, rate: 30 },
];

// ─── HRA EXEMPTION ────────────────────────────────────────────────────────────

export function calculateHRAExemption(
    basicSalary: number, da: number, hraReceived: number,
    rentPaid: number, isMetro: boolean
): number {
    if (rentPaid === 0 || hraReceived === 0) return 0;
    const basicPlusDA = basicSalary + da;
    const a = hraReceived;
    const b = Math.max(0, rentPaid - 0.1 * basicPlusDA);
    const c = (isMetro ? 0.5 : 0.4) * basicPlusDA;
    return Math.round(Math.max(0, Math.min(a, b, c)));
}

// ─── TAX ON SLABS ─────────────────────────────────────────────────────────────

export function calculateTaxOnSlabs(
    taxableIncome: number,
    slabs: SlabConfig[]
): { totalTax: number; slabBreakdown: SlabRow[] } {
    const slabBreakdown: SlabRow[] = [];
    let totalTax = 0;

    for (const slab of slabs) {
        const slabTop = slab.max === Infinity ? taxableIncome : slab.max;
        const incomeInSlab = Math.max(0, Math.min(taxableIncome, slabTop) - slab.min);
        if (incomeInSlab <= 0 && slab.min > taxableIncome) break;
        const taxInSlab = incomeInSlab * (slab.rate / 100);
        totalTax += taxInSlab;
        slabBreakdown.push({
            range: slab.max === Infinity
                ? `Above ₹${(slab.min / 100000).toFixed(0)}L`
                : `₹${(slab.min / 100000).toFixed(0) === '0' ? '0' : (slab.min / 100000)}L – ₹${(slab.max / 100000)}L`,
            taxableAmount: Math.round(incomeInSlab),
            rate: slab.rate,
            taxAmount: Math.round(taxInSlab),
        });
        if (incomeInSlab === 0) break;
    }

    return { totalTax: Math.round(totalTax), slabBreakdown };
}

// ─── MARGINAL RELIEF ──────────────────────────────────────────────────────────

function applyMarginalRelief(
    income: number,
    taxBeforeSurcharge: number,
    surchargeAmount: number,
    threshold: number,
    taxAtThreshold: number
): number {
    const totalTaxWithSurcharge = taxBeforeSurcharge + surchargeAmount;
    const excessIncome = income - threshold;
    const maxTaxAllowed = taxAtThreshold + excessIncome;
    if (totalTaxWithSurcharge > maxTaxAllowed) {
        return Math.max(0, maxTaxAllowed - taxBeforeSurcharge);
    }
    return surchargeAmount;
}

// ─── SURCHARGE ────────────────────────────────────────────────────────────────

export function calculateSurcharge(
    income: number,
    basicTax: number,
    isNewRegime: boolean,
    slabs: SlabConfig[]
): { surcharge: number; marginalRelief: number } {
    const brackets = [
        { threshold: 5000000, rate: 10 },
        { threshold: 10000000, rate: 15 },
        { threshold: 20000000, rate: 25 },
        { threshold: 50000000, rate: isNewRegime ? 25 : 37 },
    ];

    const applicableBracket = brackets.slice().reverse().find(b => income > b.threshold);
    if (!applicableBracket) return { surcharge: 0, marginalRelief: 0 };

    const surchargeRaw = Math.round(basicTax * applicableBracket.rate / 100);

    // Compute tax at threshold for marginal relief
    const taxAtThreshold = calculateTaxOnSlabs(applicableBracket.threshold, slabs).totalTax;
    const relievedSurcharge = applyMarginalRelief(
        income, basicTax, surchargeRaw,
        applicableBracket.threshold, taxAtThreshold
    );
    const marginalRelief = surchargeRaw - relievedSurcharge;

    return { surcharge: Math.round(relievedSurcharge), marginalRelief: Math.round(marginalRelief) };
}

// ─── COMPUTE SINGLE REGIME ────────────────────────────────────────────────────

function computeRegime(input: TaxInput, isOld: boolean, hraExemption: number): RegimeResult {
    const isSenior = input.ageCategory === 'senior60to80' || input.ageCategory === 'superSeniorAbove80';
    const isSuperSenior = input.ageCategory === 'superSeniorAbove80';
    const isAY2627 = input.assessmentYear === 'AY2026-27';

    // ── Standard Deduction ──
    const standardDeduction = isOld ? 50000 : 75000;

    // ── Home Loan Deduction (Old Regime only, self-occ max ₹2L) ──
    const homeLoanDeductionSelfOccupied = isOld ? Math.min(input.homeLoanInterestSelfOccupied, 200000) : 0;

    // ── Net Salary Income ──
    const netSalaryIncome = Math.max(0,
        input.grossSalary - standardDeduction
        - (isOld ? hraExemption : 0)
        - homeLoanDeductionSelfOccupied
    );

    // ── Other Income Heads ──
    const otherIncome = input.otherIncome;
    const interestIncome = input.interestIncome;
    // Net rental: let-out loan interest fully deductible in BOTH regimes against rental income
    const netRentalIncome = Math.max(0, input.rentalIncome - input.homeLoanInterestLetOut);

    const grossTotalIncome = netSalaryIncome + otherIncome + interestIncome + netRentalIncome;

    // ── Section 80 Deductions ──
    const maxTTA = isSenior ? 50000 : 10000; // 80TTB for senior, 80TTA for others
    const max80D = isSenior ? 50000 : 25000;

    const d80C = isOld ? Math.min(input.section80C, 150000) : 0;
    const d80CCD = Math.min(input.section80CCD1B, 50000); // allowed in both regimes
    const d80D = isOld ? Math.min(input.section80D, max80D) : 0;
    const d80G = isOld ? Math.round(input.section80G * 0.5) : 0; // 50% of amount
    const d80E = isOld ? input.section80E : 0;
    const d80TTA = isOld ? Math.min(input.section80TTA_TTB, maxTTA) : 0;
    const totalDeductions = d80C + d80CCD + d80D + d80G + d80E + d80TTA;

    const taxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

    // ── Tax Slabs ──
    let slabs: SlabConfig[];
    if (isOld) {
        if (isSuperSenior) slabs = OLD_SUPER_SENIOR_SLABS;
        else if (isSenior) slabs = OLD_SENIOR_SLABS;
        else slabs = OLD_BELOW60_SLABS;
    } else {
        slabs = isAY2627 ? NEW_AY2026_27_SLABS : NEW_AY2025_26_SLABS;
    }

    const { totalTax: basicTax, slabBreakdown } = calculateTaxOnSlabs(taxableIncome, slabs);

    // ── Surcharge & Marginal Relief ──
    const { surcharge, marginalRelief } = calculateSurcharge(taxableIncome, basicTax, !isOld, slabs);


    // ── Section 87A Rebate ──
    let rebate87A = 0;
    if (isOld) {
        // Super senior not eligible (already exempt up to 5L)
        if (!isSuperSenior && taxableIncome <= 500000) {
            rebate87A = Math.min(basicTax, 12500);
        }
    } else {
        // New regime: max ₹60,000 (AY2627) or ₹25,000 (AY2526)
        const rebateConfig = isAY2627
            ? { maxIncome: 1200000, maxRebate: 60000 }
            : { maxIncome: 700000, maxRebate: 25000 };
        if (taxableIncome <= rebateConfig.maxIncome) {
            rebate87A = Math.min(basicTax, rebateConfig.maxRebate);
        }
    }

    // ── Apply rebate BEFORE cess — correct statutory order ──
    // 87A rebate reduces basicTax; cess is then 4% of (reducedTax + surcharge)
    const taxAfterRebate87A = Math.max(0, basicTax - rebate87A);
    const educationCess = Math.round((taxAfterRebate87A + surcharge) * 0.04);
    const grossTax = taxAfterRebate87A + surcharge + educationCess;
    const taxAfterRebate = grossTax; // rebate already applied above

    // ── Marginal Rate ──
    const marginalTaxRate = slabs.slice().reverse().find(s => taxableIncome > s.min)?.rate ?? 0;

    const legacyBreakdown = slabBreakdown.map(r => ({ slab: r.range, taxAmount: r.taxAmount }));

    return {
        grossSalary: input.grossSalary,
        standardDeduction,
        hraExemption: isOld ? hraExemption : 0,
        homeLoanDeductionSelfOccupied,
        netSalaryIncome,
        otherIncome,
        interestIncome,
        netRentalIncome,
        grossTotalIncome,
        deduction80C: d80C,
        deduction80CCD1B: d80CCD,
        deduction80D: d80D,
        deduction80G: d80G,
        deduction80E: d80E,
        deduction80TTA_TTB: d80TTA,
        totalDeductions,
        taxableIncome,
        basicTax,
        surcharge,
        marginalRelief,
        educationCess,
        grossTax,
        rebate87A,
        taxAfterRebate,
        monthlyTax: Math.round(taxAfterRebate / 12),
        effectiveTaxRate: grossTotalIncome > 0
            ? parseFloat(((taxAfterRebate / grossTotalIncome) * 100).toFixed(2))
            : 0,
        marginalTaxRate,
        slabBreakdown,
        oldRegimeSlabBreakdown: legacyBreakdown,
        newRegimeSlabBreakdown: legacyBreakdown,
    };
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────

export function calculateIncomeTax(input: TaxInput): TaxResult {
    const hraExemption = calculateHRAExemption(
        input.basicSalary, input.da, input.hraReceived, input.rentPaid, input.isMetroCity
    );
    const hraComponents = {
        actualHRA: input.hraReceived,
        rentMinus10Percent: Math.max(0, input.rentPaid - 0.1 * (input.basicSalary + input.da)),
        percentOfBasicPlusDA: (input.isMetroCity ? 0.5 : 0.4) * (input.basicSalary + input.da),
    };

    const oldRegime = computeRegime(input, true, hraExemption);
    const newRegime = computeRegime(input, false, hraExemption);

    const recommendedRegime: 'old' | 'new' = newRegime.taxAfterRebate <= oldRegime.taxAfterRebate ? 'new' : 'old';
    const taxSavedByChoosingBetter = Math.abs(oldRegime.taxAfterRebate - newRegime.taxAfterRebate);

    return { oldRegime, newRegime, recommendedRegime, taxSavedByChoosingBetter, hraExemption, hraComponents };
}


