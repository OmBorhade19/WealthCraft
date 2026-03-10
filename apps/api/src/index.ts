import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculateSIP } from '@wealthcraft/financial-engine';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Example route using the shared workspace package
app.post('/api/calculate-sip', (req: Request, res: Response) => {
    try {
        const { monthlyInvestment, annualReturnRate, timePeriodYears } = req.body;
        const result = calculateSIP({ monthlyInvestment, annualReturnRate, timePeriodYears });
        res.json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`[WealthCraft] API listening at http://localhost:${port}`);
});
