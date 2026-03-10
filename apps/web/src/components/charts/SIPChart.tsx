import { YearlyBreakdown } from "@wealthcraft/financial-engine";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatCurrency } from "@/lib/formatters"; // Will create this

interface SIPChartProps {
    data: YearlyBreakdown[];
}

export function SIPChart({ data }: SIPChartProps) {
    // Format data for Recharts if needed, or use as is
    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 25 }}
                >
                    <defs>
                        <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorReturns" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F5A623" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#F5A623" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="year"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7FA3", fontSize: 12 }}
                        dy={10}
                        label={{ value: 'Years', position: 'insideBottom', offset: -25, fill: '#6B7FA3', fontSize: 14 }}
                    />
                    <YAxis
                        tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7FA3", fontSize: 12 }}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="invested"
                        name="Invested Amount"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorInvested)"
                        animationDuration={1500}
                    />
                    <Area
                        type="monotone"
                        dataKey="totalValue"
                        name="Total Value"
                        stroke="#F5A623"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorReturns)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="glass-tooltip flex flex-col gap-2 min-w-[200px]">
                <p className="font-medium text-muted-foreground border-b border-white/10 pb-2 mb-1">
                    Year {label}
                </p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex justify-between items-center text-sm font-mono">
                        <span style={{ color: entry.color }}>
                            {entry.name}
                        </span>
                        <span className="font-medium">
                            {formatCurrency(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return null;
};
