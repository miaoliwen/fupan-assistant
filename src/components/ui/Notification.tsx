"use client";

import { useUIStore } from "@/stores/useUIStore";
import { AnimatePresence, motion } from "framer-motion";

export function NotificationContainer() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="px-4 py-3 rounded-lg shadow-lg font-ui text-sm flex items-center gap-2"
            style={{
              backgroundColor:
                n.type === "success"
                  ? "var(--success-light)"
                  : n.type === "error"
                    ? "var(--error-light)"
                    : "var(--warm-sand)",
              color:
                n.type === "success"
                  ? "var(--success)"
                  : n.type === "error"
                    ? "var(--error)"
                    : "var(--olive-gray)",
              border: `1px solid ${n.type === "success" ? "var(--success)" : n.type === "error" ? "var(--error)" : "var(--border-warm)"}`,
            }}
          >
            <span>{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
