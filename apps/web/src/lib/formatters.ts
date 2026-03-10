export function formatCurrency(amount: number): string {
    if (isNaN(amount)) return "₹0";
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatIndianNumber(amount: number): string {
    if (isNaN(amount)) return "0";
    return new Intl.NumberFormat('en-IN', {
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatCompactCurrency(amount: number): string {
    if (isNaN(amount)) return "₹0";
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return formatCurrency(amount);
}

export function formatRate(rate: number): string {
    return `${Number(rate.toFixed(2))}%`;
}
