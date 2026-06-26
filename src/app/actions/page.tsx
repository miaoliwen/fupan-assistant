"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  PageTransition,
  StaggerReveal,
  StaggerItem,
  FadeIn,
  HoverCard,
  NumberTicker,
  motion,
  AnimatePresence,
} from "@/components/motion/MotionElements";

const categoryLabels: Record<string, string> = {
  work: "工作",
  project: "项目",
  personal: "个人",
  custom: "自定义",
};

interface ActionItem {
  id: string;
  content: string;
  status: string;
  dueDate: string | null;
  createdAt: string;
  completedAt: string | null;
  review: {
    id: string;
    title: string;
    date: string;
    category: string;
  };
}

interface ActionData {
  pending: ActionItem[];
  overdue: ActionItem[];
  dueSoon: ActionItem[];
  stats: {
    total: number;
    overdue: number;
    dueSoon: number;
  };
}

export default function ActionsPage() {
  const [data, setData] = useState<ActionData | null>(null);
  const [filter, setFilter] = useState<"all" | "overdue" | "dueSoon">("all");
  const [notifyPermission, setNotifyPermission] = useState<string>("default");

  const fetchActions = () => {
    fetch("/api/actions/extract")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => console.error("加载行动项失败:", err));
  };

  useEffect(() => {
    fetchActions();
    if ("Notification" in window) {
      setNotifyPermission(Notification.permission);
    }
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifyPermission(permission);
    if (permission === "granted") {
      new Notification("复盘助手 · 行动提醒已开启", {
        body: "系统会在行动项到期前提醒你",
      });
    }
  };

  const checkReminders = useCallback(() => {
    if (notifyPermission !== "granted" || !data) return;

    const now = new Date();
    data.pending.forEach((action) => {
      if (!action.dueDate) return;
      const due = new Date(action.dueDate);
      const hoursLeft = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursLeft <= 24 && hoursLeft > 0) {
        new Notification("行动项即将到期", {
          body: `${action.content}\n截止: ${formatDate(action.dueDate)}`,
          icon: "/favicon.ico",
        });
      }
    });
  }, [data, notifyPermission]);

  const handleComplete = async (actionId: string) => {
    const action = data?.pending.find((a) => a.id === actionId);
    if (!action) return;
    try {
      const res = await fetch(`/api/reviews/${action.review.id}/actions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: actionId, status: "done" }),
      });
      if (!res.ok) throw new Error("更新失败");
    } catch (err) {
      console.error("完成行动项失败:", err);
    }
    fetchActions();
  };

  if (!data) {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-ui"
        style={{ color: "var(--stone-gray)" }}
      >
        加载中...
      </motion.p>
    );
  }

  const displayedActions = filter === "overdue" ? data.overdue : filter === "dueSoon" ? data.dueSoon : data.pending;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <FadeIn delay={0}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <div>
              <h1
                className="font-serif"
                style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
              >
                行动追踪
              </h1>
              <p className="font-ui text-sm mt-1" style={{ color: "var(--stone-gray)" }}>
                从复盘中提取的下一步行动，追踪执行进度
              </p>
            </div>
            <div className="flex gap-2">
              {notifyPermission !== "granted" && (
                <Button variant="secondary" size="sm" onClick={enableNotifications}>
                  开启提醒
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={checkReminders}>
                检查提醒
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Stats */}
        <StaggerReveal>
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StaggerItem>
              <motion.button
                onClick={() => setFilter("all")}
                className="p-3 sm:p-4 font-ui text-left w-full"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: filter === "all" ? "2px solid var(--terracotta)" : "1px solid var(--border-cream)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>全部待办</p>
                <p className="font-serif" style={{ fontSize: "22px", fontWeight: 500, color: "var(--near-black)" }}>
                  <NumberTicker value={data.stats.total} />
                </p>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => setFilter("overdue")}
                className="p-3 sm:p-4 font-ui text-left w-full"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: filter === "overdue" ? "2px solid var(--error)" : "1px solid var(--border-cream)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>已逾期</p>
                <p className="font-serif" style={{ fontSize: "22px", fontWeight: 500, color: "var(--error)" }}>
                  <NumberTicker value={data.stats.overdue} />
                </p>
              </motion.button>
            </StaggerItem>
            <StaggerItem>
              <motion.button
                onClick={() => setFilter("dueSoon")}
                className="p-3 sm:p-4 font-ui text-left w-full"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.06)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: filter === "dueSoon" ? "2px solid var(--terracotta)" : "1px solid var(--border-cream)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>即将到期</p>
                <p className="font-serif" style={{ fontSize: "22px", fontWeight: 500, color: "var(--terracotta)" }}>
                  <NumberTicker value={data.stats.dueSoon} />
                </p>
              </motion.button>
            </StaggerItem>
          </div>
        </StaggerReveal>

        {/* Action List */}
        <AnimatePresence mode="wait">
          {displayedActions.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-10 text-center font-ui"
              style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}
            >
              <p style={{ color: "var(--stone-gray)" }}>
                {filter === "overdue" ? "没有逾期的行动项" : filter === "dueSoon" ? "没有即将到期的行动项" : "暂无待办行动项"}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--stone-gray)", opacity: 0.6 }}>
                通过「行动提取器」从复盘内容中自动生成
              </p>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StaggerReveal>
                <div className="space-y-2">
                  {displayedActions.map((action) => {
                    const isOverdue = action.dueDate && new Date(action.dueDate) < new Date();
                    return (
                      <StaggerItem key={action.id}>
                        <motion.div
                          className="p-4 font-ui flex items-start gap-3"
                          whileHover={{
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            y: -1,
                          }}
                          transition={{ type: "spring", stiffness: 100, damping: 20 }}
                          style={{
                            backgroundColor: "var(--ivory)",
                            borderRadius: "8px",
                            border: isOverdue ? "1px solid rgba(181,51,51,0.3)" : "1px solid var(--border-cream)",
                          }}
                        >
                          <motion.button
                            onClick={() => handleComplete(action.id)}
                            className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            style={{ borderColor: "var(--terracotta)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--terracotta)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            title="标记完成"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm" style={{ color: "var(--near-black)" }}>
                              {action.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-xs" style={{ color: "var(--stone-gray)" }}>
                                来自: {action.review.title}
                              </span>
                              {action.dueDate && (
                                <span
                                  className="text-xs"
                                  style={{ color: isOverdue ? "var(--error)" : "var(--stone-gray)" }}
                                >
                                  截止: {formatDate(action.dueDate)}
                                </span>
                              )}
                              {isOverdue && <Badge variant="danger">已逾期</Badge>}
                            </div>
                          </div>
                        </motion.div>
                      </StaggerItem>
                    );
                  })}
                </div>
              </StaggerReveal>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Extract */}
        <FadeIn delay={0.3}>
          <div
            className="mt-8 p-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
            }}
          >
            <h3 className="font-serif mb-2" style={{ fontSize: "16px", fontWeight: 500, color: "var(--near-black)" }}>
              AI 智能提取行动项
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--olive-gray)", lineHeight: 1.6 }}>
              从最近的复盘中自动识别下一步行动，AI 会智能设定截止日期并去重。
            </p>
            <div className="flex gap-3">
              <Link href="/reviews">
                <Button>选择复盘提取</Button>
              </Link>
              <Link href="/insights">
                <Button variant="secondary">查看 AI 洞察</Button>
              </Link>
            </div>
          </div>
        </FadeIn>

        {/* Cycle Reminder */}
        <FadeIn delay={0.35}>
          <div
            className="mt-6 p-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
            }}
          >
            <h3 className="font-serif mb-2" style={{ fontSize: "16px", fontWeight: 500, color: "var(--near-black)" }}>
              输入 → 反思 → 洞察 → 行动 → 循环
            </h3>
            <p className="text-sm mb-4" style={{ color: "var(--olive-gray)", lineHeight: 1.6 }}>
              行动完成后，记得在下次复盘中回顾执行效果，形成持续改进的闭环。
            </p>
            <div className="flex gap-3">
              <Link href="/reviews/new">
                <Button>新建复盘</Button>
              </Link>
              <Link href="/graph">
                <Button variant="secondary">知识图谱</Button>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
