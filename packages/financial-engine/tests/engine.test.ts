import { describe, it, expect } from 'vitest';
import { calculateSIP } from '../src/sip';
import { calculateStepUpSIP } from '../src/stepUpSip';
import { calculateLumpsum } from '../src/lumpsum';
import { calculateSWP } from '../src/swp';
import { calculateEMI, calculateHomeLoanVsSIP } from '../src/emi';

describe('Financial Engine Tests', () => {

    describe('SIP Calculator', () => {
        it('calculates standard SIP correctly', () => {
            const res = calculateSIP({ monthlyInvestment: 10000, annualReturnRate: 12, timePeriodYears: 10 });
            expect(res.investedAmount).toBe(1200000);
            // Fv = P × ({[1 + i]^n – 1} / i) × (1 + i)
            // i = 0.01, n = 120
            // 10000 * ((1.01^120 - 1) / 0.01) * 1.01
            // ~2323391
            expect(res.totalValue).toBeGreaterThan(2300000);
            expect(res.totalValue).toBeLessThan(2350000);
        });
    });

    describe('Step-Up SIP Calculator', () => {
        it('calculates step-up SIP correctly', () => {
            const res = calculateStepUpSIP({ monthlyInvestment: 10000, annualReturnRate: 12, timePeriodYears: 10, annualStepUpRate: 10 });
            // Invested should be more than 12L due to 10% step up
            expect(res.investedAmount).toBeGreaterThan(1200000);
            expect(res.totalValue).toBeGreaterThan(3000000); // Because standard was ~23L, step up 10% grows it much faster
        });
    });

    describe('Lumpsum Calculator', () => {
        it('calculates lumpsum growth correctly', () => {
            const res = calculateLumpsum({ principal: 100000, annualReturnRate: 10, timePeriodYears: 5 });
            expect(res.investedAmount).toBe(100000);
            // 1L @ 10% for 5 yrs = 100000 * (1.1)^5 = 161051
            expect(res.totalValue).toBe(161051);
        });
    });

    describe('SWP Calculator', () => {
        it('calculates swp correctly', () => {
            const res = calculateSWP({ corpus: 1000000, monthlyWithdrawal: 10000, annualReturnRate: 8, tenureYears: 10 });
            expect(res.totalWithdrawn).toBe(1200000); // 10k * 12 * 10
            // 10L @ 8%, withdrawing 1.2L a year -> should still have corpus remaining since 8% of 10L is 80k.
            expect(res.monthsUntilDepletion).toBe(null);
        });

        it('depletes corpus correctly when withdrawals are too high', () => {
            const res = calculateSWP({ corpus: 1000000, monthlyWithdrawal: 100000, annualReturnRate: 8, tenureYears: 5 });
            expect(res.monthsUntilDepletion).toBeTypeOf('number');
            // Should deplete in roughly 10-11 months
            expect(res.remainingCorpus).toBe(0);
        });
    });

    describe('EMI Calculator', () => {
        it('calculates home loan EMI correctly', () => {
            const res = calculateEMI({ principal: 5000000, annualInterestRate: 8.5, tenureYears: 20 });
            // ~43391 based on standard formula
            expect(res.emi).toBeGreaterThan(43000);
            expect(res.emi).toBeLessThan(44000);
        });
    });

});
