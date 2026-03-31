import { create } from 'zustand';

const CART_STORAGE_KEY = 'mcpro_cart_items_v1';

function loadPersistedItems() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistItems(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage failures (quota/private mode) and keep runtime cart working.
  }
}

export const useCartStore = create((set, get) => ({
  items: loadPersistedItems(),
  
  // Add item or increase quantity
  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.product_id === product.id);
    if (existingItem) {
      const nextItems = state.items.map((item) => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      persistItems(nextItems);
      return {
        items: nextItems
      };
    }
    // Ensure product price is a number
    const safeProduct = { ...product, price: Number(product.price) };
    const nextItems = [...state.items, { product_id: product.id, product: safeProduct, quantity: 1 }];
    persistItems(nextItems);
    return {
      items: nextItems
    };
  }),

  // Remove item or decrease quantity
  removeItem: (productId) => set((state) => {
    const existingItem = state.items.find((item) => item.product_id === productId);
    if (existingItem?.quantity > 1) {
      const nextItems = state.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
      persistItems(nextItems);
      return {
        items: nextItems
      };
    }
    const nextItems = state.items.filter((item) => item.product_id !== productId);
    persistItems(nextItems);
    return {
      items: nextItems
    };
  }),

  // Completely remove an item from cart
  deleteItem: (productId) => set((state) => {
    const nextItems = state.items.filter((item) => item.product_id !== productId);
    persistItems(nextItems);
    return {
      items: nextItems
    };
  }),

  // Clear entire cart
  clearCart: () => {
    persistItems([]);
    set({ items: [] });
  },

  // Computed totals (Refined with Number conversion)
  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getTotalPrice: () => get().items.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0),
}));
