export interface EMIInput {
    principal: number;
    annualInterestRate: number;
    tenureYears: number;
}

export interface AmortizationRow {
    month: number;
    emi: number;
    principalPaid: number;
    interestPaid: number;
    balance: number;
}

export interface EMIResult {
    emi: number;
    totalInterest: number;
    totalPayable: number;
    amortizationSchedule: AmortizationRow[];
}

export interface HomeLoanVsSIPResult {
    emiResult: EMIResult;
    sipResult: import('./sip').SIPResult;
    difference: number;
    recommendation: string;
}

export function calculateEMI(input: EMIInput): EMIResult {
    const p = input.principal;
    const r = input.annualInterestRate / 12 / 100;
    const n = input.tenureYears * 12;

    let emi = 0;
    if (r > 0) {
        emi = p * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    } else {
        emi = p / n;
    }

    const amortizationSchedule: AmortizationRow[] = [];
    let balance = p;
    let totalInterest = 0;

    for (let month = 1; month <= n; month++) {
        const interestPaid = balance * r;
        const principalPaid = emi - interestPaid;
        balance -= principalPaid;

        // Fix floating point precision on last month
        if (balance < 0.1) balance = 0;

        totalInterest += interestPaid;

        if (month % 12 === 0 || month === n) {
            // Just keeping yearly snapshots in 'amortizationSchedule' to avoid huge arrays for the UI, or mapping it by year. 
            // For exact 'AmortizationRow' per month, we can push all. 
            // The prompt says "AmortizationRow[]", we will push yearly summaries to save memory but keep it row based.
            // Actually let's push yearly summaries to the array.
        }
    }

    // To match the spec strictly:
    let trackingBalance = p;
    const fullSchedule: AmortizationRow[] = [];
    for (let month = 1; month <= n; month++) {
        const interestPaid = trackingBalance * r;
        const principalPaid = emi - interestPaid;
        trackingBalance -= principalPaid;
        if (trackingBalance < 0.1) trackingBalance = 0;

        fullSchedule.push({
            month,
            emi: Math.round(emi),
            principalPaid: Math.round(principalPaid),
            interestPaid: Math.round(interestPaid),
            balance: Math.max(0, Math.round(trackingBalance))
        });
    }

    return {
        emi: Math.round(emi),
        totalInterest: Math.round(totalInterest),
        totalPayable: Math.round(p + totalInterest),
        amortizationSchedule: fullSchedule
    };
}

import { calculateSIP } from './sip';

export function calculateHomeLoanVsSIP(emiInput: EMIInput, sipMonthly: number, sipReturn: number): HomeLoanVsSIPResult {
    const emiRes = calculateEMI(emiInput);
    const sipRes = calculateSIP({
        monthlyInvestment: sipMonthly,
        annualReturnRate: sipReturn,
        timePeriodYears: emiInput.tenureYears
    });

    const costOfLoan = emiRes.totalInterest;
    const wealthGenerated = sipRes.estimatedReturns;
    const difference = wealthGenerated - costOfLoan;

    let recommendation = '';
    if (difference > 0) {
        recommendation = `By investing ₹${sipMonthly}/mo in SIP, you can recover the entire interest cost of your home loan and make a surplus of ₹${Math.round(difference).toLocaleString('en-IN')}.`;
    } else {
        recommendation = `The SIP wealth generated (₹${Math.round(wealthGenerated).toLocaleString('en-IN')}) will cover a significant portion of your home loan interest (₹${Math.round(costOfLoan).toLocaleString('en-IN')}).`;
    }

    return {
        emiResult: emiRes,
        sipResult: sipRes,
        difference: Math.round(difference),
        recommendation
    };
}
