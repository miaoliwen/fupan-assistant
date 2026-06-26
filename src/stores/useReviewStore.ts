import { create } from "zustand";

interface Review {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string;
  sections: { sectionTitle: string; content: string }[];
  actions: { id: string; status: string; content: string }[];
}

interface ReviewState {
  reviews: Review[];
  currentReview: Review | null;
  loading: boolean;
  error: string | null;
  fetchReviews: (params?: {
    search?: string;
    category?: string;
    limit?: number;
  }) => Promise<void>;
  fetchReviewById: (id: string) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  clearCurrent: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  reviews: [],
  currentReview: null,
  loading: false,
  error: null,

  fetchReviews: async (params) => {
    set({ loading: true, error: null });
    try {
      const searchParams = new URLSearchParams();
      if (params?.search) searchParams.set("search", params.search);
      if (params?.category) searchParams.set("category", params.category);
      if (params?.limit) searchParams.set("limit", String(params.limit));

      const res = await fetch(`/api/reviews?${searchParams}`);
      if (res.status === 401) {
        set({ reviews: [], loading: false, error: "未登录" });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ reviews: data.reviews || [], loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "加载失败",
      });
    }
  },

  fetchReviewById: async (id) => {
    set({ loading: true });
    try {
      const res = await fetch(`/api/reviews/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      set({ currentReview: data, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteReview: async (id) => {
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // 从列表中移除
    set((state) => ({
      reviews: state.reviews.filter((r) => r.id !== id),
    }));
  },

  clearCurrent: () => set({ currentReview: null }),
}));
