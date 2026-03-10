const nominal = 0.12;
const inflation = 0.06;
const realRate = ((1 + nominal) / (1 + inflation)) - 1;
console.log("Real Rate (Annual):", realRate);

const monthlyRealRate = realRate / 12;
console.log("Real Rate (Monthly):", monthlyRealRate);

const P = 15000;
const n = 15 * 12; // 180 months

const FV = P * ((Math.pow(1 + monthlyRealRate, n) - 1) / monthlyRealRate);
console.log("FV (Ordinary Annuity):", FV);

import { calculateRealSIP } from './packages/financial-engine/src/inflation';

const engineResult = calculateRealSIP({
    monthlyInvestment: 15000,
    annualReturnRate: 12,
    timePeriodYears: 15
}, 6);

console.log("Engine FV:", engineResult.totalValue);
console.log("Engine Invested:", engineResult.investedAmount);
console.log("Engine Returns:", engineResult.estimatedReturns);
