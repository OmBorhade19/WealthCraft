import { describe, it, expect } from 'vitest';
import { calculateSWP } from '../src/swp';

describe('SWP Calculator (Systematic Withdrawal Plan)', () => {

    it('TestCase 1: Corpus Survives Full Tenure (Withdrawal < Monthly Return)', () => {
        // ₹50L * 1% = ₹50k return/month
        // Withdrawal = ₹20k/month
        // Corpus should survive and grow
        const result = calculateSWP({
            initialCorpus: 5000000,
            monthlyWithdrawal: 20000,
            annualReturnRate: 12,
            tenureYears: 20
        });

        expect(result.isCorpusDepletedBeforeTenure).toBe(false);
        expect(result.depletionMonth).toBeNull();
        expect(result.depletionYear).toBeNull();
        expect(result.totalWithdrawn).toBe(20000 * 12 * 20); // 48,00,000

        // Final corpus should be significantly higher than initial
        expect(result.finalCorpus).toBeGreaterThan(5000000);

        // Check some yearly breakdown logic
        expect(result.yearlyBreakdown.length).toBe(20);
        expect(result.yearlyBreakdown[19].closingCorpus).toBe(result.finalCorpus);
    });

    it('TestCase 2: Corpus Depletes Mid-Tenure (Withdrawal > Monthly Return)', () => {
        // ₹50L * 0.667% = ~₹33,333 return/month
        // Withdrawal = ₹60k/month
        // Corpus should deplete
        const result = calculateSWP({
            initialCorpus: 5000000,
            monthlyWithdrawal: 60000,
            annualReturnRate: 8,
            tenureYears: 20 // 240 months
        });

        expect(result.isCorpusDepletedBeforeTenure).toBe(true);
        expect(result.finalCorpus).toBe(0);
        expect(result.depletionMonth).not.toBeNull();
        expect(result.depletionMonth).toBeLessThanOrEqual(240);

        // Exact depletion check (should run out around month 130-140)
        // With 60k withdrawal and ~33k return, net loss is ~27k/mo initially, and accelerates.
        expect(result.monthlyBreakdown[result.monthlyBreakdown.length - 1].closingCorpus).toBe(0);
        expect(result.monthlyBreakdown[result.monthlyBreakdown.length - 1].isLastMonth).toBe(true);

        const lastMonth = result.monthlyBreakdown[result.monthlyBreakdown.length - 1];
        // Partial withdrawal check for the final month
        expect(lastMonth.withdrawal).toBeLessThanOrEqual(60000);
        expect(lastMonth.withdrawal).toBe(Math.round(lastMonth.corpusAfterReturn));
    });

    it('TestCase 3: Break-Even Withdrawal (Withdrawal == Monthly Return)', () => {
        // ₹50L * 1% = ₹50k return/month
        // Withdrawal = ₹50k/month
        // Corpus should remain exactly ₹50,00,000 indefinitely
        const result = calculateSWP({
            initialCorpus: 5000000,
            monthlyWithdrawal: 50000,
            annualReturnRate: 12, // 1% per month
            tenureYears: 20
        });

        expect(result.isCorpusDepletedBeforeTenure).toBe(false);

        // Check that every single month opens and closes at exactly 50,00,000
        for (const month of result.monthlyBreakdown) {
            expect(month.openingCorpus).toBe(5000000);
            expect(month.closingCorpus).toBe(5000000);
            expect(month.returnEarned).toBe(50000);
            expect(month.withdrawal).toBe(50000);
        }

        expect(result.totalWithdrawn).toBe(50000 * 12 * 20); // 1,20,00,000
    });

    it('Verifies Total Withdrawn never exceeds (Initial + Returns)', () => {
        const input = {
            initialCorpus: 1000000,
            monthlyWithdrawal: 150000, // Very high withdrawal to force quick depletion
            annualReturnRate: 10,
            tenureYears: 5
        };
        const result = calculateSWP(input);

        // Sum of all returns earned
        const totalReturns = result.monthlyBreakdown.reduce((sum, row) => sum + row.returnEarned, 0);

        // Total withdrawn should exactly equal Initial + Total Returns (since it depletes to 0)
        // Account for small rounding differences in JS
        const difference = Math.abs(result.totalWithdrawn - (input.initialCorpus + totalReturns));
        expect(difference).toBeLessThan(10); // Within 10 rupees of rounding error is acceptable
    });
});
