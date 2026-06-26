import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ message: string }>;
  signOut: () => Promise<void>;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signIn: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    set({ user: user ? { id: user.id, email: user.email! } : null });
  },

  signUp: async (email, password) => {
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return { message: "注册成功，请查收确认邮件" };
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },

  loadUser: async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      set({
        user: user ? { id: user.id, email: user.email! } : null,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
