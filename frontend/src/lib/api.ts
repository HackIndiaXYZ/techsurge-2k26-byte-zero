const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? '/api' : 'http://127.0.0.1:8008');

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText} (${response.status})`);
    }
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
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
  resetOrders: () => fetchApi('/orders/reset', { method: 'POST' }),
  getSummary: () => fetchApi('/summary'),
  getShippingPlan: (product: string, shopId: string, qty: number, quick?: boolean) => {
    const params = new URLSearchParams();
    if (qty !== undefined) params.append('qty', qty.toString());
    if (quick !== undefined) params.append('quick', quick.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi(`/shipping/plan/${product}/${shopId}${query}`);
  },
};
