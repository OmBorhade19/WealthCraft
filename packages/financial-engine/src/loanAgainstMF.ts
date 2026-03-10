// ─── INTERFACES ──────────────────────────────────────────────────────────────

export interface LAMFInput {
    portfolioValue: number;
    amountNeeded: number;
    originalInvestment: number;
    holdingPeriodOver1Year: boolean;
    fundType: 'equity' | 'debt';
    taxSlab: number;
    loanInterestRate: number;
    ltvPercent: number;
    loanTenureMonths: number;
    repaymentType: 'interest-only' | 'full-emi';
    expectedMFReturnRate: number;
}

export interface TaxBreakdown {
    fundType: string;
    holdingPeriod: string;
    taxType: string;
    applicableRate: string;
    proportionalCostOfAcquisition: number;
    totalGainOnSoldPortion: number;
    exemption: number;
    taxableGain: number;
    taxAmount: number;
    effectiveTaxRate: number;
    exitLoad: number;
    totalCostOfSelling: number;
}

export interface LAMFAmortizationRow {
    month: number;
    openingPrincipal: number;
    emi: number;
    interestComponent: number;
    principalComponent: number;
    closingPrincipal: number;
}

export interface GrowthTimelineRow {
    month: number;
    loanOutstanding: number;
    mfValueIfPledged: number;
    netPositionA: number;
    remainingPortfolioValue: number;
    netPositionB: number;
}

export interface LAMFResult {
    loanA: {
        maxLoanAvailable: number;
        loanAmount: number;
        monthlyEMI: number;
        monthlyInterestOnly: number;
        totalInterestPaid: number;
        totalRepayment: number;
        taxOnLoan: number;
        exitLoad: number;
        portfolioValueAtLoanEnd: number;
        portfolioGrowthDuringLoan: number;
        netWealthAtEnd: number;
    };
    sellB: {
        proportionSold: number;
        grossCashReceived: number;
        taxPaid: number;
        exitLoadAmount: number;
        netCashReceived: number;
        remainingPortfolio: number;
        remainingPortfolioFutureValue: number;
        opportunityCostOfSelling: number;
        netWealthAtEnd: number;
    };
    comparison: {
        wealthDifferenceAtEnd: number;
        betterOption: 'loan' | 'sell' | 'neutral';
        loanInterestCost: number;
        sellingTaxCost: number;
        loanCheaperBy: number;
    };
    taxCalculation: TaxBreakdown;
    loanAmortization: LAMFAmortizationRow[];
    portfolioGrowthTimeline: GrowthTimelineRow[];
    maxLoanAvailable: number;
    exceedsLTV: boolean;
}

// ─── TAX CALCULATION ─────────────────────────────────────────────────────────

export function calculateTax(input: LAMFInput): TaxBreakdown {
    const { portfolioValue, amountNeeded, originalInvestment, holdingPeriodOver1Year, fundType, taxSlab } = input;

    const effectiveAmount = Math.min(amountNeeded, portfolioValue);
    const proportionSold = effectiveAmount / portfolioValue;
    const proportionalCost = originalInvestment * proportionSold;
    const soldPortionValue = effectiveAmount;
    const totalGain = soldPortionValue - proportionalCost;

    const exitLoadRate = (fundType === 'equity' && !holdingPeriodOver1Year) ? 0.01 : 0;
    const exitLoadAmount = soldPortionValue * exitLoadRate;

    let taxType: string;
    let applicableRate: string;
    let exemption = 0;
    let taxableGain = 0;
    let taxAmount = 0;

    if (fundType === 'equity') {
        if (holdingPeriodOver1Year) {
            taxType = 'Long Term Capital Gain (LTCG)';
            applicableRate = '10% on gains above \u20b91,00,000';
            exemption = Math.min(Math.max(totalGain, 0), 100000);
            taxableGain = Math.max(totalGain - 100000, 0);
            taxAmount = taxableGain * 0.10;
        } else {
            taxType = 'Short Term Capital Gain (STCG)';
            applicableRate = '15% flat on entire gain';
            exemption = 0;
            taxableGain = Math.max(totalGain, 0);
            taxAmount = taxableGain * 0.15;
        }
    } else {
        taxType = holdingPeriodOver1Year
            ? 'Long Term Capital Gain — Slab Rate (Debt, post Apr 2023)'
            : 'Short Term Capital Gain — Slab Rate (Debt)';
        applicableRate = `${taxSlab}% (Income Tax Slab Rate)`;
        exemption = 0;
        taxableGain = Math.max(totalGain, 0);
        taxAmount = taxableGain * (taxSlab / 100);
    }

    const totalCostOfSelling = taxAmount + exitLoadAmount;
    const effectiveTaxRate = soldPortionValue > 0 ? (taxAmount / soldPortionValue) * 100 : 0;

    return {
        fundType: fundType === 'equity' ? 'Equity Fund' : 'Debt Fund',
        holdingPeriod: holdingPeriodOver1Year ? 'More than 1 year' : 'Less than 1 year',
        taxType,
        applicableRate,
        proportionalCostOfAcquisition: Math.round(proportionalCost),
        totalGainOnSoldPortion: Math.round(totalGain),
        exemption: Math.round(exemption),
        taxableGain: Math.round(taxableGain),
        taxAmount: Math.round(taxAmount),
        effectiveTaxRate: parseFloat(effectiveTaxRate.toFixed(2)),
        exitLoad: Math.round(exitLoadAmount),
        totalCostOfSelling: Math.round(totalCostOfSelling),
    };
}

// ─── LOAN AMORTIZATION ───────────────────────────────────────────────────────

export function calculateLAMFAmortization(input: LAMFInput): LAMFAmortizationRow[] {
    const { amountNeeded, loanInterestRate, loanTenureMonths, repaymentType, ltvPercent, portfolioValue } = input;
    const loanAmount = Math.min(amountNeeded, portfolioValue * (ltvPercent / 100));
    const monthlyRate = loanInterestRate / 100 / 12;
    const rows: LAMFAmortizationRow[] = [];

    if (repaymentType === 'interest-only') {
        for (let month = 1; month <= loanTenureMonths; month++) {
            const interestComponent = loanAmount * monthlyRate;
            const principalComponent = month === loanTenureMonths ? loanAmount : 0;
            const emi = interestComponent + principalComponent;
            rows.push({
                month,
                openingPrincipal: Math.round(loanAmount),
                emi: Math.round(emi),
                interestComponent: Math.round(interestComponent),
                principalComponent: Math.round(principalComponent),
                closingPrincipal: month === loanTenureMonths ? 0 : Math.round(loanAmount),
            });
        }
    } else {
        const emi = monthlyRate === 0
            ? loanAmount / loanTenureMonths
            : loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTenureMonths)) / (Math.pow(1 + monthlyRate, loanTenureMonths) - 1);

        let principal = loanAmount;
        for (let month = 1; month <= loanTenureMonths; month++) {
            const interestComponent = principal * monthlyRate;
            const principalComponent = emi - interestComponent;
            const closingPrincipal = Math.max(principal - principalComponent, 0);
            rows.push({
                month,
                openingPrincipal: Math.round(principal),
                emi: Math.round(emi),
                interestComponent: Math.round(interestComponent),
                principalComponent: Math.round(principalComponent),
                closingPrincipal: Math.round(closingPrincipal),
            });
            principal = closingPrincipal;
        }
    }
    return rows;
}

// ─── MAIN CALCULATION ─────────────────────────────────────────────────────────

export function calculateLAMF(input: LAMFInput): LAMFResult {
    const {
        portfolioValue, amountNeeded, loanInterestRate, ltvPercent,
        loanTenureMonths, repaymentType, expectedMFReturnRate
    } = input;

    const maxLoanAvailable = portfolioValue * (ltvPercent / 100);
    const exceedsLTV = amountNeeded > maxLoanAvailable;
    const loanAmount = Math.min(amountNeeded, maxLoanAvailable);

    const monthlyLoanRate = loanInterestRate / 100 / 12;
    const monthlyMFRate = expectedMFReturnRate / 100 / 12;
    const tenureYears = loanTenureMonths / 12;

    // ── OPTION A: LOAN AGAINST MF ─────────────────────────────────────────────
    const monthlyInterestOnly = loanAmount * monthlyLoanRate;
    const amortRows = calculateLAMFAmortization({ ...input, amountNeeded: loanAmount });

    let monthlyEMI = 0;
    let totalInterestPaid = 0;
    let totalRepayment = 0;

    if (repaymentType === 'interest-only') {
        monthlyEMI = monthlyInterestOnly;
        totalInterestPaid = monthlyInterestOnly * loanTenureMonths;
        totalRepayment = loanAmount + totalInterestPaid;
    } else {
        totalInterestPaid = amortRows.reduce((s, r) => s + r.interestComponent, 0);
        totalRepayment = amortRows.reduce((s, r) => s + r.emi, 0);
        monthlyEMI = amortRows[0]?.emi || 0;
    }

    const portfolioValueAtLoanEnd = portfolioValue * Math.pow(1 + expectedMFReturnRate / 100, tenureYears);
    const portfolioGrowthDuringLoan = portfolioValueAtLoanEnd - portfolioValue;
    const netWealthA = portfolioValueAtLoanEnd - totalInterestPaid;

    // ── OPTION B: SELL MF UNITS ───────────────────────────────────────────────
    const tax = calculateTax({ ...input, amountNeeded: loanAmount });

    const grossCashReceived = loanAmount;
    const taxPaid = tax.taxAmount;
    const exitLoadAmount = tax.exitLoad;
    const netCashReceived = grossCashReceived - taxPaid - exitLoadAmount;
    const proportionSold = Math.min(loanAmount / portfolioValue, 1);
    const remainingPortfolio = portfolioValue * (1 - proportionSold);
    const remainingPortfolioFutureValue = remainingPortfolio * Math.pow(1 + expectedMFReturnRate / 100, tenureYears);
    const soldPortionFutureValue = (portfolioValue * proportionSold) * Math.pow(1 + expectedMFReturnRate / 100, tenureYears);
    const opportunityCostOfSelling = soldPortionFutureValue - (portfolioValue * proportionSold);
    const netWealthB = remainingPortfolioFutureValue;

    // ── COMPARISON ────────────────────────────────────────────────────────────
    const wealthDifference = netWealthA - netWealthB;
    const betterOption: 'loan' | 'sell' | 'neutral' =
        Math.abs(wealthDifference) < 1000 ? 'neutral' : wealthDifference > 0 ? 'loan' : 'sell';

    // ── GROWTH TIMELINE ───────────────────────────────────────────────────────
    const portfolioGrowthTimeline: GrowthTimelineRow[] = [];
    for (let month = 1; month <= loanTenureMonths; month++) {
        const mfValueIfPledged = portfolioValue * Math.pow(1 + monthlyMFRate, month);
        const remainingPortfolioMonthly = remainingPortfolio * Math.pow(1 + monthlyMFRate, month);
        const loanOutstanding = repaymentType === 'full-emi' && amortRows[month - 1]
            ? amortRows[month - 1].closingPrincipal
            : month === loanTenureMonths ? 0 : loanAmount;

        portfolioGrowthTimeline.push({
            month,
            loanOutstanding: Math.round(loanOutstanding),
            mfValueIfPledged: Math.round(mfValueIfPledged),
            netPositionA: Math.round(mfValueIfPledged - loanOutstanding),
            remainingPortfolioValue: Math.round(remainingPortfolioMonthly),
            netPositionB: Math.round(remainingPortfolioMonthly),
        });
    }

    return {
        loanA: {
            maxLoanAvailable: Math.round(maxLoanAvailable),
            loanAmount: Math.round(loanAmount),
            monthlyEMI: Math.round(monthlyEMI),
            monthlyInterestOnly: Math.round(monthlyInterestOnly),
            totalInterestPaid: Math.round(totalInterestPaid),
            totalRepayment: Math.round(totalRepayment),
            taxOnLoan: 0,
            exitLoad: 0,
            portfolioValueAtLoanEnd: Math.round(portfolioValueAtLoanEnd),
            portfolioGrowthDuringLoan: Math.round(portfolioGrowthDuringLoan),
            netWealthAtEnd: Math.round(netWealthA),
        },
        sellB: {
            proportionSold,
            grossCashReceived: Math.round(grossCashReceived),
            taxPaid: Math.round(taxPaid),
            exitLoadAmount: Math.round(exitLoadAmount),
            netCashReceived: Math.round(netCashReceived),
            remainingPortfolio: Math.round(remainingPortfolio),
            remainingPortfolioFutureValue: Math.round(remainingPortfolioFutureValue),
            opportunityCostOfSelling: Math.round(opportunityCostOfSelling),
            netWealthAtEnd: Math.round(netWealthB),
        },
        comparison: {
            wealthDifferenceAtEnd: Math.round(Math.abs(wealthDifference)),
            betterOption,
            loanInterestCost: Math.round(totalInterestPaid),
            sellingTaxCost: Math.round(taxPaid + exitLoadAmount),
            loanCheaperBy: Math.round((taxPaid + exitLoadAmount) - totalInterestPaid),
        },
        taxCalculation: tax,
        loanAmortization: amortRows,
        portfolioGrowthTimeline,
        maxLoanAvailable: Math.round(maxLoanAvailable),
        exceedsLTV,
    };
}
