import { describe, it, expect } from 'vitest';
import { calculateBudget, calculateHealthScore, generateInsights, getAnnualProjection } from '../src/budgeting';

describe('Budgeting Engine', () => {
    const dummyIncome = { salary: 100000, salary2: 0, otherIncome: 10000 };
    const dummyExpenses = {
        householdExp: 15000,
        rent: 30000,
        emi: 10000,
        healthInsurance: 2000,
        insurance: 3000,
        bills: 5000,
        schoolFees: 0,
        fuel: 5000,
        personal: 5000,
        existingSIP: 15000,
        additionalExpenses: 0
    };

    it('calculates total budget correctly', () => {
        const result = calculateBudget(dummyIncome, dummyExpenses);
        expect(result.totalIncome).toBe(110000);
        expect(result.totalExpenses).toBe(90000);
        expect(result.balance).toBe(20000);
        expect(result.savingsRate).toBeCloseTo((20000 / 110000) * 100, 1);
        expect(result.recommendedSIP).toBe(Math.round(20000 * 0.3));
    });

    it('calculates correct health score', () => {
        // Total income 110,000, balance 20k -> savings 18.18% (10 points)
        // SIP 15k / 110k = 13.6% (15 points)
        // EMI 10k / 110k = 9% (< 20%, 10 points)
        // Insurance present (10 points)
        // Positive balance (15 points)
        // Total = 10 + 15 + 10 + 10 + 15 = 60
        const result = calculateHealthScore((20000 / 110000) * 100, dummyExpenses, 110000, 20000);
        expect(result).toBe(60);
    });

    it('generates proper insights for warnings', () => {
        const result = generateInsights((20000 / 110000) * 100, dummyExpenses, 110000, 20000);
        // expects savings rate warning since rate < 20%
        const hasSavingsWarning = result.some(i => i.type === 'warning' && i.message.includes('savings rate is'));
        expect(hasSavingsWarning).toBe(true);
    });

    it('generates success insights', () => {
        const successInsights = generateInsights(25, { ...dummyExpenses, existingSIP: 25000 }, 100000, 25000);
        // 25% savings + 25% SIP
        expect(successInsights.some(i => i.type === 'success' && i.message.includes('investing'))).toBe(true);
        expect(successInsights.some(i => i.type === 'success' && i.message.includes('healthy savings rate'))).toBe(true);
    });

    it('returns valid annual projection', () => {
        const proj = getAnnualProjection(100000, 80000);
        expect(proj.length).toBe(13); // 12 months + 1 total
        expect(proj[0].balance).toBe(20000);
        expect(proj[11].cumulativeSavings).toBe(240000);
        expect(proj[12].month).toBe('Total (Annual)');
        expect(proj[12].balance).toBe(240000);
    });
});
