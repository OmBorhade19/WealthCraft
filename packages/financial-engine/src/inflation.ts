import { SIPResult, YearlyBreakdown } from './sip';
import { StepUpSIPInput } from './stepUpSip';
import { LumpsumInput } from './lumpsum';

// India historical avg CPI: 6%
const DEFAULT_INFLATION_RATE = 6;

export function calculateRealReturn(nominalRatePercent: number, inflationRatePercent: number): number {
    const nominal = nominalRatePercent / 100;
    const inflation = inflationRatePercent / 100;
    const real = ((1 + nominal) / (1 + inflation)) - 1;
    return real * 100;
}

// The Fisher Equation states: (1 + nominal_rate) = (1 + real_rate) * (1 + inflation_rate)
// For a flat nominal SIP, the true purchasing power is found by discounting the nominal future value
// by the cumulative inflation over that period. This is mathematically identical to applying the real
// rate to inflation-adjusted (real) constant cash flows.

export function adjustForInflation(amount: number, years: number, inflationRate: number = DEFAULT_INFLATION_RATE): number {
    // Discounting a nominal amount back to its true purchasing power today
    return amount / Math.pow(1 + (inflationRate / 100), years);
}

export function getInflationAdjustedBreakdown(yearlyBreakdown: YearlyBreakdown[], inflationRate: number = DEFAULT_INFLATION_RATE): YearlyBreakdown[] {
    return yearlyBreakdown.map(yearData => {
        // The invested amount represents total nominal cash out of pocket up to that year.
        // The nominal returns and nominal total value are discounted by the inflation over that specific timeframe.
        const realTotalValue = adjustForInflation(yearData.totalValue, yearData.year, inflationRate);

        return {
            year: yearData.year,
            invested: yearData.invested, // We keep nominal invested to show out-of-pocket cost
            returns: Math.round(realTotalValue - yearData.invested), // Real returns = Real Value - Nominal Cost
            totalValue: Math.round(realTotalValue),
        };
    });
}
