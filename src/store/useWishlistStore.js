import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      toggleWishlist: (productId) => set((state) => {
        const exists = state.wishlist.includes(productId);
        if (exists) {
          return { wishlist: state.wishlist.filter(id => id !== productId) };
        } else {
          return { wishlist: [...state.wishlist, productId] };
        }
      }),
      isInWishlist: (productId) => get().wishlist.includes(productId),
    }),
    {
      name: 'mcpro_wishlist_v1',
    }
  )
);