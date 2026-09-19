const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8008';

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getRankings: () => fetchApi('/rankings'),
  getAnomalies: () => fetchApi('/anomalies'),
  getStatus: () => fetchApi('/status'),
  getReviews: (shopId: string) => fetchApi(`/reviews/${shopId}`),
  getInventory: (shopId: string) => fetchApi(`/inventory/${shopId}`),
  getForecast: (shopId: string, product: string) => fetchApi(`/forecast/${shopId}/${product}`),
  getOrders: () => fetchApi('/orders'),
  getVendors: (product: string) => fetchApi(`/vendors/${product}`),
  getSurges: (shop?: string, product?: string) => {
    const params = new URLSearchParams();
    if (shop) params.append('shop', shop);
    if (product) params.append('product', product);
    return fetchApi(`/surges?${params.toString()}`);
  },
  placeOrder: (product: string) => fetchApi(`/order/${product}`, { method: 'POST' }),
  getShippingPlan: (product: string, shopId: string, qty: number, quick: boolean) => 
    fetchApi(`/shipping/plan/${product}/${shopId}?qty=${qty}&quick=${quick}`),
};
