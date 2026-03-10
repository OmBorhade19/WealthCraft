import { describe, it, expect } from 'vitest';
import { calculateLAMF, calculateTax, calculateLAMFAmortization } from '../src/loanAgainstMF';
import type { LAMFInput } from '../src/loanAgainstMF';

const BASE_INPUT: LAMFInput = {
    portfolioValue: 1000000,    // ₹10L portfolio
    amountNeeded: 500000,       // ₹5L needed
    originalInvestment: 600000, // ₹6L originally invested → gain of ₹4L on full portfolio
    holdingPeriodOver1Year: true,
    fundType: 'equity',
    taxSlab: 30,
    loanInterestRate: 10,       // 10% p.a.
    ltvPercent: 60,             // 60% LTV
    loanTenureMonths: 12,       // 1 year
    repaymentType: 'interest-only',
    expectedMFReturnRate: 12,
};

describe('Loan Against MF Engine', () => {

    it('should calculate max loan available correctly based on LTV', () => {
        const result = calculateLAMF(BASE_INPUT);
        // maxLoan = 1000000 × 60% = 600000
        expect(result.maxLoanAvailable).toBe(600000);
    });

    it('should cap loan amount at max loan available when amountNeeded < max', () => {
        const result = calculateLAMF(BASE_INPUT);
        // amountNeeded ₹5L < max ₹6L, so loanAmount = 500000
        expect(result.loanA.loanAmount).toBe(500000);
        expect(result.exceedsLTV).toBe(false);
    });

    it('should flag exceedsLTV when amountNeeded exceeds LTV cap', () => {
        const result = calculateLAMF({ ...BASE_INPUT, amountNeeded: 700000 });
        // max = 600000, 700000 > 600000
        expect(result.exceedsLTV).toBe(true);
        // Actual loan capped at 600000
        expect(result.loanA.loanAmount).toBe(600000);
    });

    it('should calculate interest-only monthly repayment correctly', () => {
        const result = calculateLAMF(BASE_INPUT);
        // monthly interest = 500000 × 10% / 12 = 4166.67 ≈ 4167
        expect(result.loanA.monthlyInterestOnly).toBeCloseTo(4167, -1);
    });

    it('should calculate equity LTCG tax correctly — 10% on gains above ₹1L', () => {
        const tax = calculateTax(BASE_INPUT);
        // proportionSold = 500000 / 1000000 = 0.5
        // proportionalCost = 600000 × 0.5 = 300000
        // gain = 500000 - 300000 = 200000
        // exemption = min(200000, 100000) = 100000
        // taxableGain = 200000 - 100000 = 100000
        // tax = 100000 × 10% = 10000
        expect(tax.taxAmount).toBe(10000);
        expect(tax.exemption).toBe(100000);
        expect(tax.taxableGain).toBe(100000);
        expect(tax.exitLoad).toBe(0); // over 1 year → no exit load
    });

    it('should apply 1% exit load for equity holdings under 1 year', () => {
        const tax = calculateTax({ ...BASE_INPUT, holdingPeriodOver1Year: false });
        // exit load = 500000 × 1% = 5000
        expect(tax.exitLoad).toBe(5000);
        // STCG at 15% on gain
        expect(tax.taxType).toContain('Short Term');
    });

    it('should apply slab rate for debt funds regardless of holding period', () => {
        const debtTax = calculateTax({ ...BASE_INPUT, fundType: 'debt', taxSlab: 30 });
        // proportionalCost = 300000, gain = 200000
        // tax = 200000 × 30% = 60000
        expect(debtTax.taxAmount).toBe(60000);
        expect(debtTax.taxType).toContain('Slab Rate');
    });

    it('should generate correct number of amortization rows', () => {
        const rows = calculateLAMFAmortization(BASE_INPUT);
        expect(rows.length).toBe(12); // 12 months
    });

    it('should have decreasing closing principal in full-EMI mode', () => {
        const rows = calculateLAMFAmortization({ ...BASE_INPUT, repaymentType: 'full-emi' });
        for (let i = 1; i < rows.length; i++) {
            expect(rows[i].closingPrincipal).toBeLessThan(rows[i - 1].closingPrincipal);
        }
        // Last month closing principal should be ~0
        expect(rows[rows.length - 1].closingPrincipal).toBeLessThanOrEqual(10);
    });

    it('should log positive portfolio growth during loan period', () => {
        const result = calculateLAMF(BASE_INPUT);
        // Portfolio should grow at 12% pa over 1 year
        expect(result.loanA.portfolioGrowthDuringLoan).toBeGreaterThan(0);
        expect(result.loanA.portfolioValueAtLoanEnd).toBeGreaterThan(BASE_INPUT.portfolioValue);
    });

    it('should produce a growth timeline with correct month count', () => {
        const result = calculateLAMF(BASE_INPUT);
        expect(result.portfolioGrowthTimeline.length).toBe(12);
        expect(result.portfolioGrowthTimeline[0].month).toBe(1);
        expect(result.portfolioGrowthTimeline[11].month).toBe(12);
    });

    it('should identify better option between loan and sell', () => {
        const result = calculateLAMF(BASE_INPUT);
        expect(['loan', 'sell', 'neutral']).toContain(result.comparison.betterOption);
    });

});
