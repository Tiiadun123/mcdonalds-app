import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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

// Background sync to Supabase (Optimistic UI Approach)
const triggerCloudSync = async (items) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only sync if logged in

    let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
    
    // If no cart exists, attempt to create one
    if (!cart) {
      // Must use select() to get back the inserted ID
      const { data: newCart, error } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
      if (error || !newCart) {
        console.error('Failed to create new cart on cloud:', error);
        return;
      }
      cart = newCart;
    }

    // Overwrite the cloud with our fresh local state
    await supabase.from('cart_items').delete().eq('cart_id', cart.id);
    
    if (items.length > 0) {
      const insertData = items.map(item => ({
        cart_id: cart.id,
        product_id: item.product_id,
        quantity: item.quantity
      }));
      await supabase.from('cart_items').insert(insertData);
    }
  } catch (error) {
    console.error('Background Cart Sync Failed:', error);
  }
};

export const useCartStore = create((set, get) => ({
  items: loadPersistedItems(),
  
  // Add item or increase quantity
  addItem: (product) => set((state) => {
    const existingItem = state.items.find((item) => item.product_id === product.id);
    let nextItems;
    if (existingItem) {
      nextItems = state.items.map((item) => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      // Ensure product price is a number
      const safeProduct = { ...product, price: Number(product.price) };
      nextItems = [...state.items, { product_id: product.id, product: safeProduct, quantity: 1 }];
    }
    
    persistItems(nextItems);
    triggerCloudSync(nextItems); // Trigger background sync
    return { items: nextItems };
  }),

  // Remove item or decrease quantity
  removeItem: (productId) => set((state) => {
    const existingItem = state.items.find((item) => item.product_id === productId);
    let nextItems;

    if (existingItem?.quantity > 1) {
      nextItems = state.items.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    } else {
      nextItems = state.items.filter((item) => item.product_id !== productId);
    }
    
    persistItems(nextItems);
    triggerCloudSync(nextItems); // Trigger background sync
    return { items: nextItems };
  }),

  // Completely remove an item from cart
  deleteItem: (productId) => set((state) => {
    const nextItems = state.items.filter((item) => item.product_id !== productId);
    persistItems(nextItems);
    triggerCloudSync(nextItems); // Trigger background sync
    return { items: nextItems };
  }),

  // Clear entire cart
  clearCart: () => {
    persistItems([]);
    triggerCloudSync([]); // Trigger background sync
    set({ items: [] });
  },

  // 🌩 SMART MERGE ON LOGIN (Local + Cloud)
  syncCloudOnLogin: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Ensure cloud cart exists
      let { data: cart } = await supabase.from('carts').select('id').eq('user_id', user.id).single();
      if (!cart) {
        const { data: newCart } = await supabase.from('carts').insert({ user_id: user.id }).select('id').single();
        if (newCart) cart = newCart;
      }

      const { data: cloudItems } = await supabase
        .from('cart_items')
        .select('product_id, quantity, products(*)')
        .eq('cart_id', cart?.id);

      const localItems = get().items;
      const mergedMap = new Map();

      // 1. Put all cloud items into Map
      if (cloudItems) {
        cloudItems.forEach(ci => {
          if (ci.products) {
            mergedMap.set(ci.product_id, {
              product_id: ci.product_id,
              product: { ...ci.products, price: Number(ci.products.price) },
              quantity: ci.quantity
            });
          }
        });
      }

      // 2. Put local items into Map (Adding quantities if already exists)
      localItems.forEach(li => {
         if (mergedMap.has(li.product_id)) {
            const existing = mergedMap.get(li.product_id);
            existing.quantity += li.quantity; // Sum quantities (Smart Merge)
         } else {
            mergedMap.set(li.product_id, li);
         }
      });

      const finalItems = Array.from(mergedMap.values());
      
      // Instantly update Local Store
      persistItems(finalItems);
      set({ items: finalItems });

      // Overwrite the merged result back to Cloud
      if (cart) {
         await supabase.from('cart_items').delete().eq('cart_id', cart.id);
         if (finalItems.length > 0) {
            const insertPayload = finalItems.map(item => ({
              cart_id: cart.id,
              product_id: item.product_id,
              quantity: item.quantity
            }));
            await supabase.from('cart_items').insert(insertPayload);
         }
      }
    } catch (e) {
      console.error("Cart merge error:", e);
    }
  },

  // Computed totals (Refined with Number conversion)
  getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
  getTotalPrice: () => get().items.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0),
}));
