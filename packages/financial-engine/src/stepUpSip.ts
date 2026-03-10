import { SIPInput, SIPResult, YearlyBreakdown } from './sip';

export interface StepUpSIPInput extends SIPInput {
    annualStepUpRate: number; // percentage
}

export function calculateStepUpSIP(input: StepUpSIPInput): SIPResult {
    const monthlyRate = input.annualReturnRate / 12 / 100;
    let currentMonthlyInvestment = input.monthlyInvestment;
    let totalInvestedAmount = 0;
    let totalValue = 0;
    const yearlyBreakdown: YearlyBreakdown[] = [];

    for (let year = 1; year <= input.timePeriodYears; year++) {
        // For each year, calculate the future value of the 12 month SIP
        let yearInvested = currentMonthlyInvestment * 12;
        totalInvestedAmount += yearInvested;

        // The value of investments made *this* year, by the end of THIS year
        let eoyValueThisYearSIP = currentMonthlyInvestment * ((Math.pow(1 + monthlyRate, 12) - 1) / monthlyRate) * (1 + monthlyRate);

        // Total value at end of year = (Previous year's total value compounded for 1 year) + Value of this year's SIP
        totalValue = totalValue * Math.pow(1 + monthlyRate, 12) + eoyValueThisYearSIP;

        yearlyBreakdown.push({
            year,
            invested: Math.round(totalInvestedAmount),
            returns: Math.round(totalValue - totalInvestedAmount),
            totalValue: Math.round(totalValue)
        });

        // Step up the underlying SIP amount for the next year
        currentMonthlyInvestment = currentMonthlyInvestment * (1 + input.annualStepUpRate / 100);
    }

    return {
        investedAmount: Math.round(totalInvestedAmount),
        estimatedReturns: Math.round(totalValue - totalInvestedAmount),
        totalValue: Math.round(totalValue),
        yearlyBreakdown
    };
}
