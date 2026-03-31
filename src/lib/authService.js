import { supabase } from './supabase';

const PROFILE_SELECT_FIELDS = 'role, full_name, avatar_url, points, phone, address, updated_at';

export const authService = {
  // Sign Up with Email
  async signUp(email, password, fullName) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer', // Default role for new signups
        },
      },
    });
    if (error) throw error;
    return data;
  },

  // Sign In with Email
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // Sign In with Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) throw error;
    return data;
  },

  // Sign Out
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Reset Password (Forgot Password)
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
  },

  // Update Password (After reset)
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return data;
  },

  // Get current user session/profile
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    if (!user) return null;

    // Get role from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select(PROFILE_SELECT_FIELDS)
      .eq('id', user.id)
      .single();

    return { ...user, profile };
  },

  async updateProfile(userId, payload) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select(PROFILE_SELECT_FIELDS)
      .single();

    if (error) throw error;
    return data;
  },
};
