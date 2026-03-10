export interface SIPInput {
    monthlyInvestment: number;
    annualReturnRate: number; // percentage
    timePeriodYears: number;
}

export interface SIPResult {
    investedAmount: number;
    estimatedReturns: number;
    totalValue: number;
    yearlyBreakdown: YearlyBreakdown[];
}

export interface YearlyBreakdown {
    year: number;
    invested: number;
    returns: number;
    totalValue: number;
}

export function calculateSIP(input: SIPInput): SIPResult {
    const months = input.timePeriodYears * 12;
    const monthlyRate = input.annualReturnRate / 12 / 100;

    const investedAmount = input.monthlyInvestment * months;
    let totalValue = 0;
    totalValue = input.monthlyInvestment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

    const estimatedReturns = totalValue - investedAmount;

    const yearlyBreakdown: YearlyBreakdown[] = [];
    let currentTotal = 0;
    let currentInvested = 0;

    for (let year = 1; year <= input.timePeriodYears; year++) {
        const yearMonths = year * 12;
        currentInvested = input.monthlyInvestment * yearMonths;
        currentTotal = input.monthlyInvestment * ((Math.pow(1 + monthlyRate, yearMonths) - 1) / monthlyRate) * (1 + monthlyRate);

        yearlyBreakdown.push({
            year,
            invested: Math.round(currentInvested),
            returns: Math.round(currentTotal - currentInvested),
            totalValue: Math.round(currentTotal)
        });
    }

    return {
        investedAmount: Math.round(investedAmount),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
        yearlyBreakdown
    };
}
