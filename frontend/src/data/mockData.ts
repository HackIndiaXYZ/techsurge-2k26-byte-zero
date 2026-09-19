export const storeNames: Record<string, string> = { A: 'Shop A — Mumbai', B: 'Shop B — Delhi', C: 'Shop C — Chennai' };

export const storeRankings = [
  { store: 'A', name: 'Shop A — Mumbai', sentimentScore: 87, revenue7d: 284500, stockHealth: 78 },
  { store: 'B', name: 'Shop B — Delhi', sentimentScore: 72, revenue7d: 198300, stockHealth: 61 },
  { store: 'C', name: 'Shop C — Chennai', sentimentScore: 91, revenue7d: 312100, stockHealth: 85 },
];

export const anomalies = [
  { id: 1, store: 'B', item: 'Basmati Rice', spike: '+340%', time: '2h ago' },
  { id: 2, store: 'A', item: 'Cooking Oil', spike: '+180%', time: '4h ago' },
  { id: 3, store: 'C', item: 'Sugar 1kg', spike: '+220%', time: '6h ago' },
  { id: 4, store: 'B', item: 'Wheat Flour', spike: '+150%', time: '8h ago' },
  { id: 5, store: 'A', item: 'Milk Packets', spike: '+290%', time: '10h ago' },
  { id: 6, store: 'C', item: 'Dal Toor', spike: '+170%', time: '12h ago' },
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
    { product: 'Basmati Rice', shelf: 42, backroom: 118, maxCapacity: 200 },
    { product: 'Cooking Oil', shelf: 15, backroom: 30, maxCapacity: 150 },
    { product: 'Sugar 1kg', shelf: 67, backroom: 90, maxCapacity: 180 },
    { product: 'Milk Packets', shelf: 8, backroom: 12, maxCapacity: 100 },
  ],
  B: [
    { product: 'Basmati Rice', shelf: 22, backroom: 55, maxCapacity: 200 },
    { product: 'Wheat Flour', shelf: 38, backroom: 80, maxCapacity: 150 },
    { product: 'Dal Toor', shelf: 50, backroom: 100, maxCapacity: 180 },
    { product: 'Cooking Oil', shelf: 5, backroom: 10, maxCapacity: 100 },
  ],
  C: [
    { product: 'Sugar 1kg', shelf: 80, backroom: 140, maxCapacity: 250 },
    { product: 'Milk Packets', shelf: 55, backroom: 70, maxCapacity: 150 },
    { product: 'Dal Toor', shelf: 30, backroom: 65, maxCapacity: 180 },
    { product: 'Basmati Rice', shelf: 60, backroom: 110, maxCapacity: 200 },
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
  { name: 'Priya S.', stars: 5, text: 'Excellent quality and fresh products every time!', sentiment: 'POSITIVE' as const },
  { name: 'Rahul M.', stars: 2, text: 'Stock is often out for basic items. Disappointing.', sentiment: 'NEGATIVE' as const },
  { name: 'Anita K.', stars: 4, text: 'Good prices but delivery could be faster.', sentiment: 'POSITIVE' as const },
  { name: 'Vikram J.', stars: 3, text: 'Average experience, nothing special.', sentiment: 'NEUTRAL' as const },
];

export const recommendedOrders = [
  { id: 1, product: 'Cooking Oil', store: 'A', currentStock: 45, predictedNeed: 120, recommendedQty: 85, orderByDate: '2026-03-28', vendor: 'OilCorp India', priority: 'URGENT' as const },
  { id: 2, product: 'Milk Packets', store: 'A', currentStock: 20, predictedNeed: 90, recommendedQty: 80, orderByDate: '2026-03-27', vendor: 'DairyFresh Ltd', priority: 'URGENT' as const },
  { id: 3, product: 'Wheat Flour', store: 'B', currentStock: 118, predictedNeed: 160, recommendedQty: 55, orderByDate: '2026-04-01', vendor: 'GrainMasters', priority: 'SOON' as const },
  { id: 4, product: 'Basmati Rice', store: 'C', currentStock: 170, predictedNeed: 200, recommendedQty: 45, orderByDate: '2026-04-05', vendor: 'RiceKing Exports', priority: 'PLANNED' as const },
  { id: 5, product: 'Dal Toor', store: 'B', currentStock: 60, predictedNeed: 130, recommendedQty: 80, orderByDate: '2026-03-30', vendor: 'PulseTraders', priority: 'SOON' as const },
  { id: 6, product: 'Sugar 1kg', store: 'C', currentStock: 220, predictedNeed: 250, recommendedQty: 40, orderByDate: '2026-04-08', vendor: 'SweetHarvest Co', priority: 'PLANNED' as const },
];

export const vendors = [
  { id: 1, name: 'OilCorp India', reliability: 92, leadTime: '3 days', lastOrder: '2026-03-18', contact: 'vendor@oilcorp.in', priceHistory: [82, 84, 81, 85, 83] },
  { id: 2, name: 'DairyFresh Ltd', reliability: 88, leadTime: '1 day', lastOrder: '2026-03-22', contact: 'orders@dairyfresh.in', priceHistory: [45, 46, 44, 47, 45] },
  { id: 3, name: 'GrainMasters', reliability: 95, leadTime: '4 days', lastOrder: '2026-03-15', contact: 'supply@grainmasters.in', priceHistory: [32, 33, 31, 34, 32] },
  { id: 4, name: 'RiceKing Exports', reliability: 85, leadTime: '5 days', lastOrder: '2026-03-10', contact: 'bulk@riceking.in', priceHistory: [58, 60, 57, 62, 59] },
  { id: 5, name: 'PulseTraders', reliability: 90, leadTime: '3 days', lastOrder: '2026-03-20', contact: 'orders@pulsetraders.in', priceHistory: [72, 74, 70, 75, 73] },
  { id: 6, name: 'SweetHarvest Co', reliability: 82, leadTime: '2 days', lastOrder: '2026-03-21', contact: 'sales@sweetharvest.in', priceHistory: [38, 40, 37, 41, 39] },
];

export const networkStatus = [
  { store: 'A', name: 'Shop A — Mumbai', online: true, activeSKUs: 142, lastSync: '2 min ago' },
  { store: 'B', name: 'Shop B — Delhi', online: true, activeSKUs: 128, lastSync: '5 min ago' },
  { store: 'C', name: 'Shop C — Chennai', online: true, activeSKUs: 156, lastSync: '1 min ago' },
];
