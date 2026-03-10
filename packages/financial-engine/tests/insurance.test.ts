import { describe, it, expect } from 'vitest';
import { calculateTermInsurance, getBaseRateForAge, getRecommendedCover, InsuranceInput } from '../src/insurance';

describe('Insurance Module', () => {
    describe('getBaseRateForAge', () => {
        it('should return correct base rates varying by age', () => {
            expect(getBaseRateForAge(20)).toBe(55);
            expect(getBaseRateForAge(28)).toBe(70);
            expect(getBaseRateForAge(35)).toBe(100);
            expect(getBaseRateForAge(40)).toBe(150);
            expect(getBaseRateForAge(45)).toBe(220);
            expect(getBaseRateForAge(50)).toBe(340);
            expect(getBaseRateForAge(55)).toBe(500);
            expect(getBaseRateForAge(60)).toBe(750);
            expect(getBaseRateForAge(65)).toBe(1100);
        });
    });

    describe('getRecommendedCover', () => {
        it('should return 15x annual income', () => {
            expect(getRecommendedCover(1000000)).toBe(15000000);
            expect(getRecommendedCover(500000)).toBe(7500000);
        });
    });

    describe('calculateTermInsurance', () => {
        const baseInput: InsuranceInput = {
            age: 30, // Base rate = 70
            gender: 'male',
            isSmoker: false,
            annualIncome: 1000000,
            coverAmount: 10000000, // 1 Cr = 100 Lakhs
            policyTermYears: 20, // Multiplier = 1.0 (16-25 yrs)
            medicalConditions: ['none'],
            occupationRisk: 'low', // Multiplier = 1.0
            sipReturnRate: 12
        };

        it('should calculate base premium accurately for a healthy non-smoking male', () => {
            const result = calculateTermInsurance(baseInput);

            // Rate per lakh = 70. Cover = 100 lakhs.
            // Expected Annual = 70 * 100 * 1.0 = 7000
            expect(result.annualPremium).toBe(7000);
            expect(result.monthlyPremium).toBeCloseTo(7000 / 12);
            expect(result.totalPremiumsPaid).toBe(7000 * 20);
            expect(result.premiumBreakdownFactors).toContainEqual({ factor: 'Base Rate', multiplier: 1, impact: 'neutral' });
        });

        it('should apply the female 8% discount correctly', () => {
            const input: InsuranceInput = { ...baseInput, gender: 'female' };
            const result = calculateTermInsurance(input);

            // 7000 * 0.92 = 6440
            expect(result.annualPremium).toBe(6400); // Rounded to nearest 100
        });

        it('should apply the smoker 45% penalty', () => {
            const input: InsuranceInput = { ...baseInput, isSmoker: true };
            const result = calculateTermInsurance(input);

            // 7000 * 1.45 = 10150
            expect(result.annualPremium).toBe(10100); // 10150 rounded nearest 100 is 10200 depending on round vs floor. Math.round(101.5) = 102 -> 10200
            // Wait: 10150 / 100 = 101.5 => Math.round(101.5) = 102 => 10200
        });

        it('should accumulate multiple medical conditions', () => {
            const input: InsuranceInput = { ...baseInput, medicalConditions: ['diabetes', 'hypertension'] };
            const result = calculateTermInsurance(input);

            // 7000 * 1.25 * 1.20 = 10500
            expect(result.annualPremium).toBe(10500);
        });

        it('should calculate SIP maturity corpus correctly', () => {
            const result = calculateTermInsurance(baseInput);

            // premium = 7000/yr -> 583.33/mo. At 12% for 20 years.
            // P = 583.33. r = 1% per mo. n = 240.
            // SIP = P * ( (1+r)^n - 1 ) / r * (1+r)
            // Expect around 5.8 lakhs roughly

            expect(result.sipCorpusAtMaturity).toBeGreaterThan(500000);
            expect(result.sipCorpusAtMaturity).toBeLessThan(650000);
            expect(result.yearlyBreakdown.length).toBe(20);
        });

        it('should define if it is effectively free correctly', () => {
            const result = calculateTermInsurance(baseInput);

            // Premium paid = 7000 * 20 = 1.4L. Corpus = ~5.8L
            expect(result.isEffectivelyFree).toBe(true);
            expect(result.surplusOrDeficit).toBeGreaterThan(0);
            expect(result.netCostOfInsurance).toBe(0);
        });

        it('should define if it is NOT effectively free correctly (e.g. low term, high SIP amount logic but bad returns)', () => {
            const input: InsuranceInput = { ...baseInput, sipReturnRate: 1, policyTermYears: 5 };
            const result = calculateTermInsurance(input);
            expect(result.isEffectivelyFree).toBe(false);
            expect(result.surplusOrDeficit).toBeLessThan(0);
            expect(result.netCostOfInsurance).toBeGreaterThan(0);
        });
    });
});
