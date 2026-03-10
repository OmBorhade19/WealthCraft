import { calculateSIP, SIPResult } from './sip';
import { calculateLumpsum } from './lumpsum';

export interface ComparisonResult {
    winner: string;
    difference: number;
    option1Name: string;
    option1Value: number;
    option2Name: string;
    option2Value: number;
}

export function compareSIPvsFD(monthly: number, years: number, sipReturn: number, fdRate: number): ComparisonResult {
    // SIP Calculation
    const sipR = sipReturn / 100 / 12;
    const n = years * 12;
    const sipTotalValue = monthly * ((Math.pow(1 + sipR, n) - 1) / sipR) * (1 + sipR);

    // FD/RD Calculation (Quarterly Compounding)
    const quarterlyRate = fdRate / 100 / 4;
    const fdMonthlyRate = Math.pow(1 + quarterlyRate, 1 / 3) - 1;
    const fdTotalValue = monthly * ((Math.pow(1 + fdMonthlyRate, n) - 1) / fdMonthlyRate) * (1 + fdMonthlyRate);

    const difference = sipTotalValue - fdTotalValue;
    const winner = difference > 0 ? 'SIP' : 'FD';

    return {
        winner,
        difference: Math.abs(Math.round(difference)),
        option1Name: 'SIP',
        option1Value: Math.round(sipTotalValue),
        option2Name: 'FD',
        option2Value: Math.round(fdTotalValue)
    };
}

export function compareSIPvsLumpsum(totalAmount: number, years: number, returnRate: number): ComparisonResult {
    const monthly = totalAmount / (years * 12);

    const sipRes = calculateSIP({
        monthlyInvestment: monthly,
        annualReturnRate: returnRate,
        timePeriodYears: years
    });

    const lumpsumRes = calculateLumpsum({
        principal: totalAmount,
        annualReturnRate: returnRate,
        timePeriodYears: years
    });

    const difference = lumpsumRes.totalValue - sipRes.totalValue;

    // Lumpsum usually wins if return rate is positive due to early compounding.
    const winner = difference > 0 ? 'Lumpsum' : 'SIP';

    return {
        winner,
        difference: Math.abs(Math.round(difference)),
        option1Name: 'SIP (Staggered)',
        option1Value: sipRes.totalValue,
        option2Name: 'Lumpsum',
        option2Value: lumpsumRes.totalValue
    };
}

export interface LoanAgainstMFResult {
    maxLoanAmount: number;
    monthlyInterest: number;
    pledgedUnitsValue: number;
    exitLoadWarning?: string;
    ltcgWarning?: string;
}

export function calculateLoanAgainstMF(portfolioValue: number, ltvPercent: number, loanRate: number, exitLoad: number, ltcgApplicable: boolean): LoanAgainstMFResult {
    const maxLoanAmount = portfolioValue * (ltvPercent / 100);
    const monthlyInterest = maxLoanAmount * (loanRate / 100 / 12);

    let exitLoadWarning;
    if (exitLoad > 0) {
        exitLoadWarning = `Selling MFs instead of taking loan will incur approx ₹${Math.round(portfolioValue * (exitLoad / 100)).toLocaleString('en-IN')} in exit loads.`;
    }

    let ltcgWarning;
    if (ltcgApplicable) {
        ltcgWarning = `Selling MFs will trigger 12.5% LTCG tax after ₹1.25L exemption. Avoid sequence of return risk by taking a loan.`;
    }

    return {
        maxLoanAmount: Math.round(maxLoanAmount),
        monthlyInterest: Math.round(monthlyInterest),
        pledgedUnitsValue: portfolioValue,
        exitLoadWarning,
        ltcgWarning
    };
}
