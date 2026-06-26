"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { motion } from "@/components/motion/MotionElements";

const navItems = [
  { href: "/", label: "首页", icon: "◈" },
  { href: "/reviews", label: "复盘", icon: "◇" },
  { href: "/stats", label: "统计", icon: "◎" },
  { href: "/insights", label: "洞察", icon: "◆" },
  { href: "/actions", label: "行动", icon: "▷" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden flex items-center justify-around px-2 pb-safe"
      style={{
        backgroundColor: "var(--deep-dark)",
        borderTop: "1px solid var(--border-dark)",
        paddingTop: "8px",
      }}
    >
      {navItems.slice(0, 5).map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-0.5 rounded-lg transition-all duration-200"
            style={{
              padding: "6px 12px",
              minWidth: "56px",
            }}
          >
            <motion.span
              className="text-base"
              whileTap={{ scale: 0.85 }}
              style={{
                color: isActive ? "var(--terracotta)" : "var(--warm-silver)",
                opacity: isActive ? 1 : 0.5,
              }}
            >
              {item.icon}
            </motion.span>
            <span
              className="text-[10px] font-ui"
              style={{
                color: isActive ? "var(--ivory)" : "var(--warm-silver)",
                opacity: isActive ? 1 : 0.6,
              }}
            >
              {item.label}
            </span>
            {isActive && (
              <motion.div
                layoutId="bottomNavActive"
                className="absolute -top-px h-0.5 w-8 rounded-full"
                style={{ backgroundColor: "var(--terracotta)" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              />
            )}
          </Link>
        );
      })}
      <button
        onClick={toggleTheme}
        className="flex flex-col items-center gap-0.5 rounded-lg transition-all duration-200"
        style={{ padding: "6px 12px", minWidth: "56px" }}
      >
        <span
          className="text-base"
          style={{ color: "var(--warm-silver)", opacity: 0.5 }}
        >
          {theme === "dark" ? "☀" : "☾"}
        </span>
        <span
          className="text-[10px] font-ui"
          style={{ color: "var(--warm-silver)", opacity: 0.6 }}
        >
          主题
        </span>
      </button>
    </nav>
  );
}
