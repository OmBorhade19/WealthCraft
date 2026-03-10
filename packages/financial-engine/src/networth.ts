export interface Assets {
    savings: number;
    fixedDeposits: number;
    cash: number;
    mutualFunds: number;
    stocks: number;
    ppf: number;
    epf: number;
    nps: number;
    gold: number;
    crypto: number;
    otherInvestments: number;
    primaryHome: number;
    otherRealEstate: number;
    otherAssets: number;
}

export interface Liabilities {
    homeLoan: number;
    carLoan: number;
    personalLoan: number;
    creditCardDues: number;
    otherLiabilities: number;
}

export interface AssetAllocationItem {
    category: string;
    amount: number;
    percentage: number;
}

export interface NetworthResult {
    totalAssets: number;
    totalLiabilities: number;
    networth: number;
    assetAllocation: AssetAllocationItem[];
}

export function calculateNetworth(assets: Assets, liabilities: Liabilities): NetworthResult {
    const totalAssets = Object.values(assets).reduce((acc, val) => acc + (val || 0), 0);
    const totalLiabilities = Object.values(liabilities).reduce((acc, val) => acc + (val || 0), 0);
    const networth = totalAssets - totalLiabilities;

    // Group assets for allocation chart based on the new input structure
    const financialAssets = (assets.savings || 0) + (assets.mutualFunds || 0) + (assets.stocks || 0) + (assets.otherInvestments || 0) + (assets.ppf || 0); // Include ppf since ppfEpfNps gets mapped there
    const propertyAssets = (assets.primaryHome || 0);
    const goldJewelryAssets = (assets.gold || 0);
    const vehicleAssets = (assets.otherAssets || 0); // otherAssets maps to vehicle + other in the UI

    const assetAllocation: AssetAllocationItem[] = [
        { category: 'Financial Assets', amount: financialAssets, percentage: (financialAssets / totalAssets) * 100 || 0 },
        { category: 'Property', amount: propertyAssets, percentage: (propertyAssets / totalAssets) * 100 || 0 },
        { category: 'Gold & Jewellery', amount: goldJewelryAssets, percentage: (goldJewelryAssets / totalAssets) * 100 || 0 },
        { category: 'Vehicles & Others', amount: vehicleAssets, percentage: (vehicleAssets / totalAssets) * 100 || 0 }
    ].filter(item => item.amount > 0);

    return {
        totalAssets,
        totalLiabilities,
        networth,
        assetAllocation
    };
}
