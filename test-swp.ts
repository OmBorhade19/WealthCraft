import { calculateSWP } from "./packages/financial-engine/src/swp";
import * as fs from 'fs';

const res = calculateSWP({
    initialCorpus: 5000000,
    monthlyWithdrawal: 60000,
    annualReturnRate: 8,
    tenureYears: 20
});
fs.writeFileSync('test-swp-fixed.json', JSON.stringify(res, null, 2));
