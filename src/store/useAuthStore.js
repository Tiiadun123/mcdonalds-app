import { create } from 'zustand';
import { authService } from '../lib/authService';
import { useCartStore } from './useCartStore';
import { useWishlistStore } from './useWishlistStore';

function clearAuthHashFromUrl() {
  const hash = window.location.hash || '';
  const hasAuthTokens =
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('token_type=');

  if (hasAuthTokens) {
    const cleanUrl = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,

  // Initialize Auth State (Check session on load)
  init: async () => {
    try {
      set({ isLoading: true });
      const userData = await authService.getCurrentUser();
      clearAuthHashFromUrl();
      
      if (userData) {
        set({ 
          user: userData, 
          profile: userData.profile, 
          isAuthenticated: true 
        });
        // Trigger smart sync on app load if logged in
        useCartStore.getState().syncCloudOnLogin();
        useWishlistStore.getState().syncCloudOnLogin();
      } else {
        set({ user: null, profile: null, isAuthenticated: false });
      }
    } catch (error) {
      console.error('Auth Init Error:', error);
      set({ user: null, profile: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  // Log In
  signIn: async (email, password) => {
    set({ isLoading: true });
    try {
      await authService.signIn(email, password);
      const userData = await authService.getCurrentUser();
      if (!userData) throw new Error('Không thể lấy thông tin user sau khi đăng nhập.');
      
      set({ 
        user: userData, 
        profile: userData.profile, 
        isAuthenticated: true 
      });
      // Trigger smart sync right after manual login
      useCartStore.getState().syncCloudOnLogin();
      useWishlistStore.getState().syncCloudOnLogin();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      set({ isLoading: false });
    }
  },

  // Refresh Profile (to update points after checkout)
  refreshProfile: async () => {
    try {
      const userData = await authService.getCurrentUser();
      if (userData) {
        set({ profile: userData.profile });
      }
    } catch (error) {
      console.error('Refresh Profile Error:', error);
    }
  },

  updateProfile: async (payload) => {
    try {
      const userData = await authService.getCurrentUser();
      if (!userData?.id) {
        return { success: false, error: new Error('Không tìm thấy phiên đăng nhập.') };
      }

      const updatedProfile = await authService.updateProfile(userData.id, payload);
      set({ profile: updatedProfile });
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  },

  // Log Out
  signOut: async () => {
    try {
      await authService.signOut();
      
      // Clear data locally to prevent leak
      useCartStore.getState().clearCart();
      useWishlistStore.setState({ wishlist: [] });
      
      set({ user: null, profile: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout Error:', error);
    }
  },
}));
