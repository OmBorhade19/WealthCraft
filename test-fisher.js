const P = 15000;
const N = 180;
const r_nom_annual = 0.12;
const i_inf_annual = 0.06;

const r_nom = r_nom_annual / 12;
const i_inf = i_inf_annual / 12;

// 1. Nominal Maturity
let nominalFV = 0;
for (let k = 1; k <= N; k++) {
    nominalFV += P * Math.pow(1 + r_nom, k);
}

console.log("Nominal FV (Annuity Due):", nominalFV);

// 2. Discounted Final Value (The Groww Method)
const growwRealFV = nominalFV / Math.pow(1 + i_inf_annual, 15);
console.log("Method 1 (Discount Final Value by Annual Inflation):", growwRealFV);

// 3. Discounted Final Value by Monthly Inflation
const growwRealFVMonthly = nominalFV / Math.pow(1 + i_inf, N);
console.log("Method 1b (Discount Final Value by Monthly Inflation):", growwRealFVMonthly);

// 4. Monthly Real Return Method (Fisher equation applied Monthly)
const r_real_monthly = ((1 + r_nom) / (1 + i_inf)) - 1;
let fisherRealFV = 0;
for (let k = 1; k <= N; k++) {
    // If we invest P nominal rupees at month k, its REAL value at month k is P / (1+i_inf)^k
    // Then it grows at r_real_monthly for (N-k) months.
    // Actually, no. If we use the Fisher equation strictly on the rate:
    fisherRealFV += P * Math.pow(1 + r_real_monthly, k);
}
console.log("Method 2 (Fisher Equation applied to Monthly Rate, assuming constant Real Deposits):", fisherRealFV);

// 5. True Real Value of Constant Nominal Deposits
let trueRealFV = 0;
for (let k = 1; k <= N; k++) {
    // At month N-k (from end), we invest P
    // Its nominal value at end = P * (1+r_nom)^k
    // Its real value at end = Nominal / (1+i_inf)^N  (discounting the final amount to today's purchasing power)
    trueRealFV += P * Math.pow(1 + r_nom, k) / Math.pow(1 + i_inf, N);
}
console.log("Method 3 (True Real Value of Nominal Cash Flows):", trueRealFV);

// 6. Annual Real Return Method (What we currently do)
const real_annual_rate = ((1 + r_nom_annual) / (1 + i_inf_annual)) - 1;
const real_monthly_rate_from_annual = real_annual_rate / 12;
let method4FV = P * ((Math.pow(1 + real_monthly_rate_from_annual, N) - 1) / real_monthly_rate_from_annual); // Ordinary annuity as the user asked
console.log("Method 4 (Our Current Implementation):", method4FV);

