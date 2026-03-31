import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Background sync to Supabase (Optimistic UI Approach)
const triggerCloudSync = async (wishlistItems) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('wishlists').delete().eq('user_id', user.id);
    
    if (wishlistItems.length > 0) {
      const insertData = wishlistItems.map(productId => ({
        user_id: user.id,
        product_id: productId
      }));
      await supabase.from('wishlists').insert(insertData);
    }
  } catch (error) {
    console.error('Background Wishlist Sync Failed:', error);
  }
};

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlist: [],
      toggleWishlist: (productId) => set((state) => {
        const exists = state.wishlist.includes(productId);
        let nextWishlist;
        if (exists) {
          nextWishlist = state.wishlist.filter(id => id !== productId);
        } else {
          nextWishlist = [...state.wishlist, productId];
        }
        triggerCloudSync(nextWishlist);
        return { wishlist: nextWishlist };
      }),
      isInWishlist: (productId) => get().wishlist.includes(productId),

      syncCloudOnLogin: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data: cloudItems } = await supabase
            .from('wishlists')
            .select('product_id')
            .eq('user_id', user.id);

          const localItems = get().wishlist;
          const mergedSet = new Set([...localItems]);
          if (cloudItems) {
            cloudItems.forEach(item => mergedSet.add(item.product_id));
          }

          const finalItems = Array.from(mergedSet);
          set({ wishlist: finalItems });

          await supabase.from('wishlists').delete().eq('user_id', user.id);
          if (finalItems.length > 0) {
            const insertPayload = finalItems.map(productId => ({
              user_id: user.id,
              product_id: productId
            }));
            await supabase.from('wishlists').insert(insertPayload);
          }
        } catch (e) {
          console.error("Wishlist merge error:", e);
        }
      }
    }),
    {
      name: 'mcpro_wishlist_v1',
    }
  )
);