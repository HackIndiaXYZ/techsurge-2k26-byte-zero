export const storeNames: Record<string, string> = { A: 'Shop A — Mumbai', B: 'Shop B — Delhi', C: 'Shop C — Chennai' };

export const storeRankings = [
  { store: 'A', name: 'Shop A — Mumbai', sentimentScore: 87, revenue7d: 284500, stockHealth: 78 },
  { store: 'B', name: 'Shop B — Delhi', sentimentScore: 72, revenue7d: 198300, stockHealth: 61 },
  { store: 'C', name: 'Shop C — Chennai', sentimentScore: 91, revenue7d: 312100, stockHealth: 85 },
];

export const anomalies = [
  { id: 1, store: 'A', item: 'Jeans', spike: '+340%', time: '2h ago' },
  { id: 2, store: 'B', item: 'Vacuum Cleaner', spike: '+180%', time: '4h ago' },
  { id: 3, store: 'C', item: 'Television', spike: '+220%', time: '6h ago' },
  { id: 4, store: 'B', item: 'Laptop', spike: '+150%', time: '8h ago' },
  { id: 5, store: 'A', item: 'Shirt', spike: '+290%', time: '10h ago' },
  { id: 6, store: 'C', item: 'Sofa', spike: '+170%', time: '12h ago' },
];

const genDays = (base: number, variance: number) =>
  Array.from({ length: 7 }, (_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    actual: Math.round(base + (Math.random() - 0.5) * variance),
    predicted: Math.round(base * 1.1 + (Math.random() - 0.5) * variance * 0.6),
  }));

export const networkSalesData: Record<string, ReturnType<typeof genDays>> = {
  All: genDays(800, 200),
  A: genDays(280, 80),
  B: genDays(220, 60),
  C: genDays(310, 90),
};

export const genForecast = (storeId: string) =>
  Array.from({ length: 30 }, (_, i) => {
    const base = storeId === 'A' ? 95 : storeId === 'B' ? 78 : 110;
    return {
      day: i + 1,
      actual: i < 14 ? Math.round(base + (Math.random() - 0.4) * 30) : null,
      forecast: Math.round(base + Math.sin(i / 4) * 20 + (Math.random() - 0.5) * 10),
    };
  });

export const inventoryData: Record<string, Array<{ product: string; shelf: number; backroom: number; maxCapacity: number }>> = {
  A: [
    { product: 'Sofa', shelf: 10, backroom: 100, maxCapacity: 200 },
    { product: 'Television', shelf: 3, backroom: 10, maxCapacity: 200 },
    { product: 'Bed', shelf: 1, backroom: 40, maxCapacity: 200 },
    { product: 'Toaster', shelf: 8, backroom: 20, maxCapacity: 200 },
    { product: 'Laptop', shelf: 12, backroom: 50, maxCapacity: 200 },
    { product: 'Smartphone', shelf: 15, backroom: 80, maxCapacity: 200 },
  ],
  B: [
    { product: 'Sofa', shelf: 5, backroom: 70, maxCapacity: 200 },
    { product: 'Television', shelf: 4, backroom: 60, maxCapacity: 200 },
    { product: 'Bed', shelf: 8, backroom: 100, maxCapacity: 200 },
    { product: 'Coffee Maker', shelf: 6, backroom: 35, maxCapacity: 200 },
    { product: 'Vacuum Cleaner', shelf: 7, backroom: 45, maxCapacity: 200 },
    { product: 'Tablet', shelf: 11, backroom: 60, maxCapacity: 200 },
  ],
  C: [
    { product: 'Sofa', shelf: 6, backroom: 80, maxCapacity: 200 },
    { product: 'Television', shelf: 5, backroom: 70, maxCapacity: 200 },
    { product: 'Bed', shelf: 9, backroom: 110, maxCapacity: 200 },
    { product: 'Microwave', shelf: 8, backroom: 40, maxCapacity: 200 },
    { product: 'Couch', shelf: 4, backroom: 25, maxCapacity: 200 },
    { product: 'Refrigerator', shelf: 3, backroom: 15, maxCapacity: 200 },
  ],
};

export const sentimentAxes = [
  { axis: 'Quality', A: 82, B: 68, C: 90 },
  { axis: 'Delivery', A: 75, B: 71, C: 85 },
  { axis: 'Price', A: 88, B: 80, C: 78 },
  { axis: 'Availability', A: 70, B: 55, C: 88 },
  { axis: 'Service', A: 85, B: 65, C: 92 },
];

export const reviews = [
  { name: 'Priya S.', stars: 5, text: 'Excellent build quality and durable furniture!', sentiment: 'POSITIVE' as const },
  { name: 'Rahul M.', stars: 2, text: 'Stock is often low for popular electronics. Needs restocking.', sentiment: 'NEGATIVE' as const },
  { name: 'Anita K.', stars: 4, text: 'Great prices on appliances but shipping took 4 days.', sentiment: 'POSITIVE' as const },
  { name: 'Vikram J.', stars: 3, text: 'Average experience, packaging was slightly damaged.', sentiment: 'NEUTRAL' as const },
];

export const recommendedOrders = [
  { id: 1, product: 'Vacuum Cleaner', store: 'B', currentStock: 15, predictedNeed: 120, recommendedQty: 104, orderByDate: '2025-05-24', vendor: 'FastShip Inc', priority: 'URGENT' as const },
  { id: 2, product: 'Couch', store: 'B', currentStock: 10, predictedNeed: 100, recommendedQty: 91, orderByDate: '2025-05-25', vendor: 'QuickDeliver', priority: 'URGENT' as const },
  { id: 3, product: 'Bed', store: 'A', currentStock: 41, predictedNeed: 120, recommendedQty: 78, orderByDate: '2025-05-25', vendor: 'LuxuryGoods', priority: 'URGENT' as const },
  { id: 4, product: 'Dining Table', store: 'B', currentStock: 25, predictedNeed: 80, recommendedQty: 55, orderByDate: '2025-05-28', vendor: 'BulkSupply Co', priority: 'SOON' as const },
  { id: 5, product: 'Television', store: 'A', currentStock: 13, predictedNeed: 60, recommendedQty: 47, orderByDate: '2025-05-30', vendor: 'EcoFriendly Supplies', priority: 'SOON' as const },
  { id: 6, product: 'Refrigerator', store: 'C', currentStock: 18, predictedNeed: 50, recommendedQty: 32, orderByDate: '2025-06-02', vendor: 'FastShip Inc', priority: 'PLANNED' as const },
];

export const vendors = [
  { id: 1, name: 'FastShip Inc', reliability: 95, leadTime: '3 days', lastOrder: '2025-05-20', contact: 'ops@fastship.com', priceHistory: [380, 390, 385, 399, 395] },
  { id: 2, name: 'QuickDeliver', reliability: 92, leadTime: '2 days', lastOrder: '2025-05-22', contact: 'dispatch@quickdeliver.com', priceHistory: [340, 345, 342, 350, 348] },
  { id: 3, name: 'BulkSupply Co', reliability: 88, leadTime: '5 days', lastOrder: '2025-05-18', contact: 'orders@bulksupply.com', priceHistory: [310, 315, 312, 320, 318] },
  { id: 4, name: 'LuxuryGoods', reliability: 97, leadTime: '4 days', lastOrder: '2025-05-15', contact: 'concierge@luxurygoods.com', priceHistory: [440, 450, 445, 455, 450] },
  { id: 5, name: 'EcoFriendly Supplies', reliability: 91, leadTime: '3 days', lastOrder: '2025-05-21', contact: 'green@ecosupplies.com', priceHistory: [360, 365, 362, 370, 368] },
];

export const networkStatus = [
  { store: 'A', name: 'Shop A — Mumbai', online: true, activeSKUs: 20, lastSync: '2 min ago' },
  { store: 'B', name: 'Shop B — Delhi', online: true, activeSKUs: 20, lastSync: '5 min ago' },
  { store: 'C', name: 'Shop C — Chennai', online: true, activeSKUs: 20, lastSync: '1 min ago' },
];
