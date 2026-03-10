import { describe, it, expect } from 'vitest';
import { calculateIncomeTax, calculateHRAExemption } from '../src/tax';

const BASE: import('../src/tax').TaxInput = {
    assessmentYear: 'AY2026-27',
    ageCategory: 'below60',
    grossSalary: 0, otherIncome: 0, interestIncome: 0,
    rentalIncome: 0, homeLoanInterestSelfOccupied: 0, homeLoanInterestLetOut: 0,
    section80C: 0, section80CCD1B: 0, section80D: 0,
    section80G: 0, section80E: 0, section80TTA_TTB: 0,
    basicSalary: 0, da: 0, hraReceived: 0, rentPaid: 0, isMetroCity: false,
};

describe('Income Tax Engine — FY 2025-26 (AY 2026-27)', () => {

    // ─── Test 1: New Regime — Zero Tax (₹12.75L for salaried) ─────────────────
    it('Test 1 — New Regime AY2026-27: ₹12.75L salary → zero tax via 87A rebate', () => {
        const result = calculateIncomeTax({ ...BASE, grossSalary: 1275000 });
        const r = result.newRegime;

        // Taxable = 1275000 - 75000 std deduction = 1200000
        expect(r.taxableIncome).toBe(1200000);

        // Tax slab: 0% on ₹4L + 5% on ₹4L (=20000) + 10% on ₹4L (=40000) = 60000
        expect(r.basicTax).toBe(60000);

        // Rebate applies (income ≤ ₹12L), max ₹60,000
        expect(r.rebate87A).toBe(60000);

        // Net tax = 0
        expect(r.taxAfterRebate).toBe(0);
    });

    // ─── Test 2: New Regime — Above Rebate Threshold ──────────────────────────
    it('Test 2 — New Regime AY2026-27: ₹15.75L salary → tax due (income > ₹12L)', () => {
        const result = calculateIncomeTax({ ...BASE, grossSalary: 1575000 });
        const r = result.newRegime;

        // Taxable = 1575000 - 75000 = 1500000
        expect(r.taxableIncome).toBe(1500000);

        // Tax: 0 on 4L + 5%×4L=20000 + 10%×4L=40000 + 15%×3L=45000 = 105000
        expect(r.basicTax).toBe(105000);

        // No 87A rebate (income > ₹12L)
        expect(r.rebate87A).toBe(0);

        // Cess = 105000 × 4% = 4200
        expect(r.educationCess).toBe(4200);

        // Total = 105000 + 4200 = 109200
        expect(r.taxAfterRebate).toBe(109200);
    });

    // ─── Test 3: Old Regime — Below 60, full 80C ──────────────────────────────
    it('Test 3 — Old Regime AY2026-27: ₹10L salary + full 80C → correct tax', () => {
        const result = calculateIncomeTax({ ...BASE, grossSalary: 1000000, section80C: 150000 });
        const r = result.oldRegime;

        // Taxable = 1000000 - 50000 std - 150000 80C = 800000
        expect(r.taxableIncome).toBe(800000);

        // Tax: 0 on 2.5L + 5%×2.5L=12500 + 20%×3L=60000 = 72500
        expect(r.basicTax).toBe(72500);

        // Cess = 72500 × 4% = 2900
        expect(r.educationCess).toBe(2900);

        // No 87A (income > 5L)
        expect(r.rebate87A).toBe(0);

        // Total = 72500 + 2900 = 75400
        expect(r.taxAfterRebate).toBe(75400);
    });

    // ─── Test 4: Senior Citizen — 87A Rebate Wipes Tax ───────────────────────
    it('Test 4 — Old Regime AY2026-27: Senior ₹5L salary → 87A rebate wipes tax', () => {
        const result = calculateIncomeTax({ ...BASE, ageCategory: 'senior60to80', grossSalary: 500000 });
        const r = result.oldRegime;

        // Taxable = 500000 - 50000 = 450000
        expect(r.taxableIncome).toBe(450000);

        // Tax: 0 on 3L + 5%×(450000-300000) = 5%×150000 = 7500
        expect(r.basicTax).toBe(7500);

        // 87A rebate: income ≤ ₹5L, rebate = min(7500, 12500) = 7500
        expect(r.rebate87A).toBe(7500);

        // Zero net tax
        expect(r.taxAfterRebate).toBe(0);
    });

    // ─── Test 5: Super Senior — No 87A Rebate ────────────────────────────────
    it('Test 5 — Old Regime AY2026-27: Super Senior ₹6.5L → no 87A rebate', () => {
        const result = calculateIncomeTax({ ...BASE, ageCategory: 'superSeniorAbove80', grossSalary: 650000 });
        const r = result.oldRegime;

        // Taxable = 650000 - 50000 = 600000
        expect(r.taxableIncome).toBe(600000);

        // Tax: 0 on 5L + 20%×(600000-500000) = 20%×100000 = 20000
        expect(r.basicTax).toBe(20000);

        // No 87A rebate for super senior
        expect(r.rebate87A).toBe(0);

        // Cess = 20000 × 4% = 800
        expect(r.educationCess).toBe(800);

        // Total = 20000 + 800 = 20800
        expect(r.taxAfterRebate).toBe(20800);
    });

    // ─── Test 6: HRA Exemption Calculation ───────────────────────────────────
    it('Test 6 — HRA Exemption: min(actual, rent-10%, 40% basic) for non-metro', () => {
        // a = 240000, b = 180000 - 60000 = 120000, c = 40% × 600000 = 240000
        // min = 120000
        const hra = calculateHRAExemption(600000, 0, 240000, 180000, false);
        expect(hra).toBe(120000);
    });

    // ─── Test 7: Surcharge at ₹55L ───────────────────────────────────────────
    it('Test 7 — New Regime AY2026-27: ₹55L income attracts 10% surcharge', () => {
        const result = calculateIncomeTax({ ...BASE, grossSalary: 5500000 });
        const r = result.newRegime;

        // Taxable = 5500000 - 75000 = 5425000
        expect(r.taxableIncome).toBe(5425000);

        // Surcharge should be > 0 (10% on basic tax since income 50L-1Cr bracket)
        expect(r.surcharge).toBeGreaterThan(0);

        // Tax after rebate must be > basic tax due to surcharge
        expect(r.taxAfterRebate).toBeGreaterThan(r.basicTax);
    });

});
