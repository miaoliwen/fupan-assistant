"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore } from "@/stores/useUIStore";
import {
  motion,
  StaggerReveal,
  StaggerItem,
} from "@/components/motion/MotionElements";

const navItems = [
  { href: "/", label: "首页", icon: "◈" },
  { href: "/reviews", label: "复盘", icon: "◇" },
  { href: "/stats", label: "统计", icon: "◎" },
  { href: "/insights", label: "洞察", icon: "◆" },
  { href: "/graph", label: "图谱", icon: "◇" },
  { href: "/actions", label: "行动", icon: "▷" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuthStore();
  const { addNotification } = useUIStore();

  const handleLogout = async () => {
    try {
      await signOut();
      addNotification("success", "已退出登录");
      router.push("/login");
    } catch {
      addNotification("error", "退出失败");
    }
  };

  return (
    <aside
      className="hidden md:flex w-56 shrink-0 flex-col min-h-screen border-r font-ui"
      style={{
        backgroundColor: "var(--deep-dark)",
        borderColor: "var(--border-dark)",
      }}
    >
      <motion.div
        className="px-6 py-6"
        style={{ borderBottom: "1px solid var(--border-dark)" }}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <h1
          className="text-lg font-serif tracking-tight"
          style={{ color: "var(--ivory)", fontWeight: 500 }}
        >
          复盘助手
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--warm-silver)", opacity: 0.7 }}>
          结构化反思，持续成长
        </p>
      </motion.div>

      <nav className="flex-1 px-3 py-4">
        <StaggerReveal>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <StaggerItem key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-1 text-sm font-ui"
                  style={{
                    backgroundColor: isActive ? "var(--dark-surface)" : "transparent",
                    color: isActive ? "var(--ivory)" : "var(--warm-silver)",
                    ...(isActive ? { boxShadow: "0px 0px 0px 1px var(--border-dark)" } : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "var(--dark-surface)";
                      e.currentTarget.style.color = "var(--ivory)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "var(--warm-silver)";
                    }
                  }}
                >
                  <span className="text-xs opacity-60">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerReveal>
      </nav>

      <motion.div
        className="px-3 py-4 font-ui"
        style={{ borderTop: "1px solid var(--border-dark)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.4 }}
      >
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-sm font-ui transition-all duration-200"
          style={{
            color: "var(--warm-silver)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--dark-surface)";
            e.currentTarget.style.color = "var(--ivory)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "var(--warm-silver)";
          }}
        >
          <span className="text-xs opacity-60">{theme === "dark" ? "☀" : "☾"}</span>
          <span>{theme === "dark" ? "浅色模式" : "深色模式"}</span>
        </button>
        {user && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-sm font-ui transition-all duration-200 mt-1"
            style={{
              color: "var(--warm-silver)",
              backgroundColor: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--dark-surface)";
              e.currentTarget.style.color = "var(--ivory)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--warm-silver)";
            }}
          >
            <span className="text-xs opacity-60">◻</span>
            <span>退出登录</span>
          </button>
        )}
        <p className="text-xs mt-3 px-4" style={{ color: "var(--stone-gray)", opacity: 0.5 }}>
          {user ? user.email : "本地优先 · 数据安全"}
        </p>
      </motion.div>
    </aside>
  );
}
