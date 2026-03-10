export interface InsuranceInput {
    age: number;
    annualIncome: number;
    isSmoker: boolean;
    coverAmount: number;
    policyTermYears: number;
    sipReturnRate: number;
    customSipAmount?: number;
}

export interface InsuranceChartRow {
    year: number;
    cumulativePremium: number;
    sipCorpus: number;
}

export interface InsuranceResult {
    annualPremium: number;           // base premium without GST
    monthlyPremium: number;          // base premium without GST
    totalPremiumsPaid: number;       // annual × years
    requiredMonthlySIP: number;      // the recommended amount
    actualMonthlySIP: number;        // the amount used for the chart
    sipCorpusAtMaturity: number;
    breakEvenYear: number;           // year gold line crosses red
    chartData: InsuranceChartRow[];
}

// IALM 2012-14 Mortality Table
// qx = probability of death per 1000 lives at age x (per mille)
// Source: IRDAI / Institute of Actuaries of India
export const IALM_MORTALITY_TABLE: Record<number, number> = {
    18: 0.834, 19: 0.826, 20: 0.820, 21: 0.817, 22: 0.816,
    23: 0.818, 24: 0.822, 25: 0.830, 26: 0.843, 27: 0.861,
    28: 0.885, 29: 0.915, 30: 0.953, 31: 0.999, 32: 1.054,
    33: 1.119, 34: 1.195, 35: 1.283, 36: 1.383, 37: 1.497,
    38: 1.626, 39: 1.771, 40: 1.933, 41: 2.114, 42: 2.315,
    43: 2.537, 44: 2.782, 45: 3.052, 46: 3.348, 47: 3.673,
    48: 4.028, 49: 4.416, 50: 4.839, 51: 5.299, 52: 5.800,
    53: 6.343, 54: 6.933, 55: 7.571, 56: 8.261, 57: 9.006,
    58: 9.810, 59: 10.676, 60: 11.608, 61: 12.610, 62: 13.685,
    63: 14.838, 64: 16.072, 65: 17.392
};

export function getRecommendedCover(annualIncome: number, age: number): number {
    let incomeMultiplier: number;
    if (age <= 30) incomeMultiplier = 20;
    else if (age <= 40) incomeMultiplier = 15;
    else if (age <= 50) incomeMultiplier = 10;
    else incomeMultiplier = 7;

    const hlvCover = annualIncome * incomeMultiplier;
    return Math.round(hlvCover / 500000) * 500000;
}

export function calculateNetPremium(
    coverAmount: number,
    startAge: number,
    termYears: number,
    discountRate: number = 0.07
): number {
    let epvClaims = 0;
    let survivalProbability = 1;

    for (let t = 0; t < termYears; t++) {
        const currentAge = startAge + t;
        const qx = (IALM_MORTALITY_TABLE[currentAge] ?? 17.0) / 1000;

        const probabilityOfDyingInYearT = survivalProbability * qx;
        const discountFactor = 1 / Math.pow(1 + discountRate, t + 1);

        epvClaims += probabilityOfDyingInYearT * coverAmount * discountFactor;
        survivalProbability *= (1 - qx);
    }

    let epvPremiumAnnuity = 0;
    survivalProbability = 1;

    for (let t = 0; t < termYears; t++) {
        const currentAge = startAge + t;
        const qx = (IALM_MORTALITY_TABLE[currentAge] ?? 17.0) / 1000;
        const discountFactor = 1 / Math.pow(1 + discountRate, t);

        epvPremiumAnnuity += survivalProbability * discountFactor;
        survivalProbability *= (1 - qx);
    }

    return epvClaims / epvPremiumAnnuity;
}

export function calculateRequiredSIP(
    totalPremiumsToBePaid: number,
    sipReturnRate: number,
    termYears: number
): number {
    const monthlyRate = sipReturnRate / 100 / 12;
    const months = termYears * 12;

    if (monthlyRate === 0) return Math.ceil(totalPremiumsToBePaid / months);

    // Standard formula: We want the Future Value (FV) of the SIP to equal the Total Premiums Paid.
    // FV = PMT * [((1 + r)^n - 1) / r] * (1 + r)
    // PMT = (FV * r) / (((1 + r)^n - 1) * (1 + r))
    const requiredMonthlySIP =
        (totalPremiumsToBePaid * monthlyRate) /
        ((Math.pow(1 + monthlyRate, months) - 1) * (1 + monthlyRate));

    return Math.ceil(requiredMonthlySIP);
}

export function calculateTermInsurance(input: InsuranceInput): InsuranceResult {
    const recommendedCover = getRecommendedCover(input.annualIncome, input.age);
    const coverAmountToUse = input.coverAmount || recommendedCover;

    const netPremium = calculateNetPremium(coverAmountToUse, input.age, input.policyTermYears);

    // Hardcoded Conservative Loading Defaults
    const expenseLoading = netPremium * 0.25;
    const profitLoading = netPremium * 0.10;
    let grossPremium = netPremium + expenseLoading + profitLoading;

    if (input.isSmoker) {
        grossPremium += netPremium * 0.85; // 85% extra on net risk
    }

    // Implicitly assuming male (no 8% female discount applied, keeping premium higher/conservative)
    // Implicitly assuming healthy (no medical condition loadings)
    // Implicitly assuming low risk occupation (no occupation loadings)

    const annualPremium = Math.round(grossPremium / 100) * 100;
    const monthlyPremium = Math.round(annualPremium / 12);
    const totalPremiumsPaid = annualPremium * input.policyTermYears;

    const requiredMonthlySIP = calculateRequiredSIP(totalPremiumsPaid, input.sipReturnRate, input.policyTermYears);
    const actualMonthlySIP = input.customSipAmount && input.customSipAmount > 0
        ? input.customSipAmount
        : requiredMonthlySIP;

    const sipReturnRateMonthly = (input.sipReturnRate / 100) / 12;

    let currentSIPValue = 0;
    let currentCumulativeTotalPremium = 0;
    let breakEvenYear = 0;
    const chartData: InsuranceChartRow[] = [];

    for (let year = 1; year <= input.policyTermYears; year++) {
        for (let month = 1; month <= 12; month++) {
            currentSIPValue = (currentSIPValue + actualMonthlySIP) * (1 + sipReturnRateMonthly);
        }
        currentCumulativeTotalPremium += annualPremium;

        // Crossover: when SIP value reaches the total premiums paid
        if (breakEvenYear === 0 && currentSIPValue >= currentCumulativeTotalPremium) {
            breakEvenYear = year;
        }

        chartData.push({
            year,
            cumulativePremium: currentCumulativeTotalPremium,
            sipCorpus: Math.round(currentSIPValue),
        });
    }

    const sipCorpusAtMaturity = Math.round(currentSIPValue);

    return {
        annualPremium,
        monthlyPremium,
        totalPremiumsPaid,
        requiredMonthlySIP,
        actualMonthlySIP,
        sipCorpusAtMaturity: Math.round(currentSIPValue),
        breakEvenYear,
        chartData
    };
}
