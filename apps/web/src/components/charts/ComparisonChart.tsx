import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Cell } from "recharts";
import { formatCurrency } from "@/lib/formatters";

interface ComparisonChartProps {
    data: any[];
}

export function ComparisonChart({ data }: ComparisonChartProps) {
    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7FA3", fontSize: 13, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#6B7FA3", fontSize: 12 }}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60} animationDuration={1000}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass-tooltip flex flex-col gap-2 min-w-[200px]">
                <p className="font-medium text-muted-foreground border-b border-brand-surfaceBorder/50 pb-2 mb-1">
                    {label}
                </p>
                <div className="flex justify-between items-center text-sm font-mono text-foreground">
                    <span>Total Value</span>
                    <span className="font-bold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }}></span>
                        {formatCurrency(data.value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};
