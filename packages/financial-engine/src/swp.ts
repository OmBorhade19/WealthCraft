export interface SWPInput {
    initialCorpus: number;       // total invested amount ₹
    monthlyWithdrawal: number;   // fixed amount withdrawn every month ₹
    annualReturnRate: number;    // expected annual return % (decimals allowed)
    tenureYears: number;         // how long user wants to withdraw for
}

export interface SWPResult {
    // Summary outputs
    totalInvested: number;           // = initialCorpus (doesn't change)
    totalWithdrawn: number;          // sum of all successful withdrawals
    finalCorpus: number;             // corpus remaining at end (0 if depleted)

    // Depletion info
    isCorpusDepletedBeforeTenure: boolean;
    depletionMonth: number | null;   // which month corpus ran out (null if survived)
    depletionYear: number | null;    // which year corpus ran out (null if survived)

    // Breakdown
    yearlyBreakdown: SWPYearlyRow[];
    monthlyBreakdown: SWPMonthlyRow[];
}

export interface SWPYearlyRow {
    year: number;
    openingCorpus: number;       // corpus at start of year
    returnEarned: number;        // total return earned during the year
    totalWithdrawn: number;      // total withdrawn during the year
    closingCorpus: number;       // corpus at end of year
}

export interface SWPMonthlyRow {
    month: number;               // absolute month number (1, 2, 3...)
    year: number;                // which year this month falls in
    openingCorpus: number;       // corpus before return applied
    returnEarned: number;        // return earned this month
    corpusAfterReturn: number;   // corpus after return, before withdrawal
    withdrawal: number;          // amount actually withdrawn this month
    // NOTE: if corpus < monthlyWithdrawal,
    // withdrawal = remaining corpus (partial)
    // and corpus becomes 0 after this
    closingCorpus: number;       // corpus after withdrawal
    isLastMonth: boolean;        // true if corpus depleted this month
}

function getEmptySWPResult(initialCorpus?: number): SWPResult {
    return {
        totalInvested: initialCorpus || 0,
        totalWithdrawn: 0,
        finalCorpus: initialCorpus || 0,
        isCorpusDepletedBeforeTenure: false,
        depletionMonth: null,
        depletionYear: null,
        yearlyBreakdown: [],
        monthlyBreakdown: []
    };
}

export function calculateSWP(input: SWPInput): SWPResult {

    // Guard: ensure all inputs are valid numbers
    if (
        !input.initialCorpus || !input.monthlyWithdrawal ||
        !input.annualReturnRate || !input.tenureYears ||
        isNaN(input.initialCorpus) || isNaN(input.monthlyWithdrawal)
    ) {
        return getEmptySWPResult(input.initialCorpus);
    }

    // Use CAGR for effective monthly rate (Indian Mutual Fund standard)
    const annualRateDec = input.annualReturnRate / 100;
    const monthlyRate = Math.pow(1 + annualRateDec, 1 / 12) - 1;
    const totalMonths = input.tenureYears * 12;

    let corpus = input.initialCorpus; // THIS VALUE MUST CHANGE EACH MONTH
    let totalWithdrawn = 0;
    let depletionMonth: number | null = null;
    let depletionYear: number | null = null;

    const monthlyBreakdown: SWPMonthlyRow[] = [];
    const yearlyBreakdown: SWPYearlyRow[] = [];

    let yearOpeningCorpus = corpus;
    let yearReturnEarned = 0;
    let yearTotalWithdrawn = 0;

    for (let month = 1; month <= totalMonths; month++) {

        // We no longer stop at zero, we let it go negative to show the debt/shortfall

        const openingCorpus = corpus; // snapshot before this month's changes

        // STEP 1: Apply return FIRST
        const returnEarned = corpus * monthlyRate;
        corpus = corpus + returnEarned;

        const corpusAfterReturn = corpus;

        // STEP 2: Withdraw AFTER return (always withdraw full amount to show shortfall)
        const actualWithdrawal = input.monthlyWithdrawal;

        corpus = corpus - actualWithdrawal;
        totalWithdrawn = totalWithdrawn + actualWithdrawal;

        // STEP 3: Check depletion
        if (corpus <= 0 && depletionMonth === null) {
            depletionMonth = month;
            depletionYear = Math.ceil(month / 12);
        }

        const currentYear = Math.ceil(month / 12);
        yearReturnEarned = yearReturnEarned + returnEarned;
        yearTotalWithdrawn = yearTotalWithdrawn + actualWithdrawal;

        monthlyBreakdown.push({
            month,
            year: currentYear,
            openingCorpus: Math.round(openingCorpus),
            returnEarned: Math.round(returnEarned),
            corpusAfterReturn: Math.round(corpusAfterReturn),
            withdrawal: Math.round(actualWithdrawal),
            closingCorpus: Math.round(corpus),
            isLastMonth: corpus <= 0 || month === totalMonths
        });

        // Build yearly row at end of each 12-month block
        if (month % 12 === 0 || month === totalMonths) {
            yearlyBreakdown.push({
                year: currentYear,
                openingCorpus: Math.round(yearOpeningCorpus),
                returnEarned: Math.round(yearReturnEarned),
                totalWithdrawn: Math.round(yearTotalWithdrawn),
                closingCorpus: Math.round(corpus)
            });
            // Reset yearly accumulators
            yearOpeningCorpus = corpus;
            yearReturnEarned = 0;
            yearTotalWithdrawn = 0;
        }
    }

    return {
        totalInvested: input.initialCorpus,
        totalWithdrawn: Math.round(totalWithdrawn),
        finalCorpus: Math.round(corpus),
        isCorpusDepletedBeforeTenure: depletionMonth !== null,
        depletionMonth,
        depletionYear,
        yearlyBreakdown,   // ← CHART MUST USE THIS
        monthlyBreakdown   // ← MONTHLY TABLE MUST USE THIS
    };
}
