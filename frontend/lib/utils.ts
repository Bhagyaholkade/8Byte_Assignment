export function formatCurrency(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(value);
}

export function formatNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('en-IN').format(value);
}

export function formatPercentage(value: number | undefined, decimals = 2): string {
    if (value === undefined || value === null) return '—';
    return `${(value * 100).toFixed(decimals)}%`;
}

export function formatCompactNumber(value: number | undefined): string {
    if (value === undefined || value === null) return '—';

    if (value >= 1e7) {
        return `₹${(value / 1e7).toFixed(2)}Cr`;
    } else if (value >= 1e5) {
        return `₹${(value / 1e5).toFixed(2)}L`;
    } else if (value >= 1e3) {
        return `₹${(value / 1e3).toFixed(2)}K`;
    }
    return formatCurrency(value);
}

export function getColorForProfitLoss(value: number | undefined): string {
    if (value === undefined || value === null) return 'text-gray-500';
    return value >= 0 ? 'text-green-600' : 'text-red-600';
}
