import { create } from "zustand";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface UIState {
  notifications: Notification[];
  sidebarOpen: boolean;
  addNotification: (type: Notification["type"], message: string) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  notifications: [],
  sidebarOpen: false,

  addNotification: (type, message) => {
    const id = Date.now().toString();
    set((state) => ({
      notifications: [...state.notifications, { id, type, message }],
    }));
    // 3秒后自动移除
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 3000);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },
}));
