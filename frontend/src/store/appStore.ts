import { create } from 'zustand';

export type UserRole = 'owner' | 'manager';
export type StoreId = 'A' | 'B' | 'C';

interface AppState {
  role: UserRole | null;
  selectedStore: StoreId | null;
  setRole: (role: UserRole) => void;
  setSelectedStore: (store: StoreId) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  selectedStore: null,
  setRole: (role) => set({ role }),
  setSelectedStore: (store) => set({ selectedStore: store }),
  reset: () => set({ role: null, selectedStore: null }),
}));
