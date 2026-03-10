import { SIPResult, YearlyBreakdown } from './sip';

export interface LumpsumInput {
    principal: number;
    annualReturnRate: number;
    timePeriodYears: number;
}

export function calculateLumpsum(input: LumpsumInput): SIPResult {
    const totalValue = input.principal * Math.pow(1 + input.annualReturnRate / 100, input.timePeriodYears);
    const estimatedReturns = totalValue - input.principal;

    const yearlyBreakdown: YearlyBreakdown[] = [];

    for (let year = 1; year <= input.timePeriodYears; year++) {
        const currentTotal = input.principal * Math.pow(1 + input.annualReturnRate / 100, year);
        yearlyBreakdown.push({
            year,
            invested: Math.round(input.principal),
            returns: Math.round(currentTotal - input.principal),
            totalValue: Math.round(currentTotal)
        });
    }

    return {
        investedAmount: Math.round(input.principal),
        estimatedReturns: Math.round(estimatedReturns),
        totalValue: Math.round(totalValue),
        yearlyBreakdown
    };
}
