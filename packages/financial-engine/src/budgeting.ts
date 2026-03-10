export interface IncomeInputs {
    salary?: number;
    salary2?: number;
    otherIncome?: number;
}

export interface ExpenseInputs {
    householdExp?: number;
    rent?: number;
    emi?: number;
    healthInsurance?: number;
    insurance?: number;
    bills?: number;
    schoolFees?: number;
    fuel?: number;
    personal?: number;
    existingSIP?: number;
    additionalExpenses?: number;
}

export interface ExpenseBreakdownItem {
    category: string;
    amount: number;
    percentOfIncome: number;
    status: 'healthy' | 'high' | 'critical' | 'low';
}

export interface FinancialInsight {
    type: 'success' | 'warning' | 'critical' | 'tip';
    message: string;
}

export interface MonthlyProjectionRow {
    month: string;
    income: number;
    expenses: number;
    balance: number;
    cumulativeSavings: number;
}

export interface BudgetResult {
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    savingsRate: number; // percentage
    expenseBreakdown: ExpenseBreakdownItem[];
    healthScore: number;
    insights: FinancialInsight[];
    recommendedSIP: number;
    annualProjection: MonthlyProjectionRow[];
}

export function calculateBudget(rawIncome: IncomeInputs, rawExpenses: ExpenseInputs): BudgetResult {
    const safeValue = (val: number | undefined | null) => (Number.isNaN(val) || !val) ? 0 : Number(val);

    const income = {
        salary: safeValue(rawIncome.salary),
        salary2: safeValue(rawIncome.salary2),
        otherIncome: safeValue(rawIncome.otherIncome)
    };

    const expenses: Required<ExpenseInputs> = {
        householdExp: safeValue(rawExpenses.householdExp),
        rent: safeValue(rawExpenses.rent),
        emi: safeValue(rawExpenses.emi),
        healthInsurance: safeValue(rawExpenses.healthInsurance),
        insurance: safeValue(rawExpenses.insurance),
        bills: safeValue(rawExpenses.bills),
        schoolFees: safeValue(rawExpenses.schoolFees),
        fuel: safeValue(rawExpenses.fuel),
        personal: safeValue(rawExpenses.personal),
        existingSIP: safeValue(rawExpenses.existingSIP),
        additionalExpenses: safeValue(rawExpenses.additionalExpenses)
    };

    const totalIncome = Object.values(income).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    const expenseBreakdown = generateExpenseBreakdown(totalIncome, expenses);
    const healthScore = calculateHealthScore(savingsRate, expenses, totalIncome, balance);
    const insights = generateInsights(savingsRate, expenses, totalIncome, balance);
    const recommendedSIP = balance > 0 ? Math.round(balance * 0.3) : 0;
    const annualProjection = getAnnualProjection(totalIncome, totalExpenses);

    return {
        totalIncome,
        totalExpenses,
        balance,
        savingsRate,
        expenseBreakdown,
        healthScore,
        insights,
        recommendedSIP,
        annualProjection
    };
}

export function generateExpenseBreakdown(totalIncome: number, expenses: Required<ExpenseInputs>): ExpenseBreakdownItem[] {
    const breakdown: ExpenseBreakdownItem[] = [];

    const addCategory = (name: string, amount: number, healthyMax: number, criticalMin?: number) => {
        if (amount <= 0) return;
        const percent = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;
        let status: 'healthy' | 'high' | 'critical' | 'low' = 'healthy';

        if (percent > (criticalMin ?? healthyMax + 10)) {
            status = 'critical';
        } else if (percent > healthyMax) {
            status = 'high';
        }

        breakdown.push({
            category: name,
            amount: amount || 0,
            percentOfIncome: Number(percent.toFixed(1)),
            status
        });
    };

    addCategory("Housing/Rent", expenses.rent, 30, 40);
    addCategory("EMI/Loans", expenses.emi, 20, 30);
    addCategory("Food/Household", expenses.householdExp, 15, 25);
    addCategory("Health Insurance", expenses.healthInsurance, 5, 10);
    addCategory("Life/Other Insurance", expenses.insurance, 5, 10);
    addCategory("Bills & Utilities", expenses.bills, 10, 15);
    addCategory("School/Education", expenses.schoolFees, 15, 25);
    addCategory("Transport/Fuel", expenses.fuel, 10, 15);
    addCategory("Personal", expenses.personal, 10, 15);
    addCategory("Additional", expenses.additionalExpenses, 10, 20);

    // existingSIP is special (higher is better)
    if (expenses.existingSIP > 0) {
        const percent = totalIncome > 0 ? (expenses.existingSIP / totalIncome) * 100 : 0;
        let status: 'healthy' | 'high' | 'critical' | 'low' = 'healthy';
        if (percent < 10) status = 'low';
        else if (percent < 20) status = 'high'; // between 10 and 20 is "high" warning but realistically it means "needs improvement", we map it as 'high' to use the amber badge

        breakdown.push({
            category: "Existing SIP",
            amount: expenses.existingSIP,
            percentOfIncome: Number(percent.toFixed(1)),
            status: percent >= 20 ? 'healthy' : (percent < 10 ? 'low' : 'high')
        });
    }

    return breakdown;
}

export function calculateHealthScore(savingsRate: number, expenses: Required<ExpenseInputs>, totalIncome: number, balance: number): number {
    let score = 0;

    // Savings rate
    if (savingsRate >= 30) score += 30;
    else if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 10;

    // SIP/Investments
    const sipPercent = totalIncome > 0 ? (expenses.existingSIP / totalIncome) * 100 : 0;
    if (sipPercent >= 20) score += 25;
    else if (sipPercent >= 10) score += 15;

    // EMI Burden
    const emiPercent = totalIncome > 0 ? (expenses.emi / totalIncome) * 100 : 0;
    if (expenses.emi === 0) score += 20;
    else if (emiPercent < 20) score += 10;

    // Insurance check
    if (expenses.healthInsurance > 0 || expenses.insurance > 0) score += 10;

    // Positive balance
    if (balance >= 0) score += 15;

    return Math.min(100, Math.max(0, score));
}

export function generateInsights(savingsRate: number, expenses: Required<ExpenseInputs>, totalIncome: number, balance: number): FinancialInsight[] {
    const insights: FinancialInsight[] = [];

    const emiPercent = totalIncome > 0 ? (expenses.emi / totalIncome) * 100 : 0;
    const rentPercent = totalIncome > 0 ? (expenses.rent / totalIncome) * 100 : 0;
    const sipPercent = totalIncome > 0 ? (expenses.existingSIP / totalIncome) * 100 : 0;

    // 1. Negative balance check
    if (balance < 0) {
        insights.push({
            type: 'critical',
            message: `🚨 You are spending ₹${Math.abs(balance).toLocaleString('en-IN')} more than you earn. Immediate expense reduction is needed.`
        });
    } else {
        // 2. Savings rate check
        if (savingsRate < 20) {
            insights.push({
                type: 'warning',
                message: `⚠ Your savings rate is ${savingsRate.toFixed(1)}%. Financial experts recommend saving at least 20% of your income.`
            });
        } else {
            insights.push({
                type: 'success',
                message: `✅ Great! You have a healthy savings rate of ${savingsRate.toFixed(1)}%. Consider deploying ₹${Math.round(balance * 0.3).toLocaleString('en-IN')} into a new SIP.`
            });
        }
    }

    // 3. EMI check
    if (emiPercent > 40) {
        insights.push({
            type: 'critical',
            message: `🚨 Your EMI burden is ${emiPercent.toFixed(1)}% of income, which is very high. This limits your ability to invest and save.`
        });
    }

    // 4. Rent check
    if (rentPercent > 30) {
        insights.push({
            type: 'warning',
            message: `🏠 Your rent is ${rentPercent.toFixed(1)}% of income, above the recommended 30%. This is your biggest financial pressure point.`
        });
    }

    // 5. Insurance check
    if (expenses.healthInsurance === 0 && expenses.insurance === 0 && totalIncome > 0) {
        insights.push({
            type: 'warning',
            message: `⚠ You have no insurance expense recorded. Life and health insurance are essential financial safety nets.`
        });
    }

    // 6. Investments check
    if (sipPercent < 10 && balance > 0) {
        insights.push({
            type: 'tip',
            message: `💡 You are investing only ${sipPercent.toFixed(1)}% of your income. Starting a SIP of ₹${Math.round(balance * 0.3).toLocaleString('en-IN')} could build significant wealth in 10 years.`
        });
    } else if (sipPercent >= 20) {
        insights.push({
            type: 'success',
            message: `🌟 Excellent! You are investing ${sipPercent.toFixed(1)}% of your income, keeping your future secure.`
        });
    }

    return insights;
}

export function getAnnualProjection(monthlyIncome: number, monthlyExpenses: number): MonthlyProjectionRow[] {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const projection: MonthlyProjectionRow[] = [];
    const monthlyBalance = monthlyIncome - monthlyExpenses;
    let cumulative = 0;

    for (const month of months) {
        cumulative += monthlyBalance;
        projection.push({
            month,
            income: monthlyIncome,
            expenses: monthlyExpenses,
            balance: monthlyBalance,
            cumulativeSavings: cumulative
        });
    }

    // Add Annual Total row
    projection.push({
        month: "Total (Annual)",
        income: monthlyIncome * 12,
        expenses: monthlyExpenses * 12,
        balance: monthlyBalance * 12,
        cumulativeSavings: cumulative
    });

    return projection;
}
