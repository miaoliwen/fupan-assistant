"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  PageTransition,
  StaggerReveal,
  StaggerItem,
  FadeIn,
  HoverCard,
  NumberTicker,
  motion,
} from "@/components/motion/MotionElements";

interface Stats {
  totalReviews: number;
  categoryStats: Record<string, number>;
  totalActions: number;
  doneActions: number;
  pendingActions: number;
  completionRate: number;
  dailyData: { date: string; count: number }[];
  monthlyData: { month: string; count: number }[];
  streak: number;
}

const categoryLabels: Record<string, string> = {
  work: "工作",
  project: "项目",
  personal: "个人",
  custom: "自定义",
};

function Heatmap({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex flex-wrap gap-1">
      {data.map((d) => {
        const intensity = d.count / max;
        let bg = "var(--border-cream)";
        if (d.count > 0 && intensity <= 0.33) bg = "#e8d8c8";
        else if (d.count > 0 && intensity <= 0.66) bg = "#d4b89a";
        else if (d.count > 0) bg = "var(--terracotta)";
        return (
          <div
            key={d.date}
            className="w-4 h-4 rounded-sm relative group"
            style={{ backgroundColor: bg }}
            title={`${d.date}: ${d.count} 篇`}
          >
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs font-ui rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{
                backgroundColor: "var(--near-black)",
                color: "var(--ivory)",
              }}
            >
              {d.date}: {d.count} 篇
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setStats)
      .catch((err) => console.error("加载统计数据失败:", err));
  }, []);

  if (!stats) {
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

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        <FadeIn delay={0}>
          <h1
            className="font-serif mb-6 sm:mb-8"
            style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
          >
            统计概览
          </h1>
        </FadeIn>

        <StaggerReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              { label: "总复盘数", value: stats.totalReviews, suffix: "", color: "var(--near-black)" },
              { label: "连续复盘", value: stats.streak, suffix: " 天", color: "var(--terracotta)" },
              {
                label: "行动完成率",
                value: stats.completionRate,
                suffix: "%",
                color: stats.completionRate >= 70 ? "var(--terracotta)" : "var(--near-black)",
              },
              { label: "待办行动", value: stats.pendingActions, suffix: "", color: "var(--near-black)" },
            ].map((item) => (
              <StaggerItem key={item.label}>
                <HoverCard
                  className="p-4 sm:p-5 font-ui"
                  style={{
                    backgroundColor: "var(--ivory)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-cream)",
                  }}
                >
                  <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>
                    {item.label}
                  </p>
                  <p className="font-serif" style={{ fontSize: "24px", fontWeight: 500, color: item.color }}>
                    <NumberTicker value={item.value} />{item.suffix}
                  </p>
                </HoverCard>
              </StaggerItem>
            ))}
          </div>
        </StaggerReveal>

        <FadeIn delay={0.15}>
          <div
            className="p-5 sm:p-6 mb-5 sm:mb-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
            }}
          >
            <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
              30 天复盘热力图
            </h2>
            <Heatmap data={stats.dailyData} />
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div
            className="p-5 sm:p-6 mb-5 sm:mb-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
            }}
          >
            <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
              月度趋势
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-cream)" />
                <XAxis dataKey="month" tick={{ fill: "var(--stone-gray)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--stone-gray)", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--ivory)",
                    border: "1px solid var(--border-cream)",
                    borderRadius: "8px",
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="count" name="复盘数" fill="var(--terracotta)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <div
            className="p-5 sm:p-6 mb-5 sm:mb-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
            }}
          >
            <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
              分类分布
            </h2>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(stats.categoryStats).map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat === "work" ? "var(--terracotta)" : cat === "project" ? "#8b7355" : cat === "personal" ? "#6b8e6b" : "var(--stone-gray)" }}
                  />
                  <span style={{ color: "var(--olive-gray)" }}>
                    {categoryLabels[cat] || cat}: {count}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-1 rounded-lg overflow-hidden">
              {Object.entries(stats.categoryStats).map(([cat, count]) => {
                const pct = Math.round((count / stats.totalReviews) * 100);
                return (
                  <motion.div
                    key={cat}
                    className="h-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.3 }}
                    style={{
                      backgroundColor:
                        cat === "work"
                          ? "var(--terracotta)"
                          : cat === "project"
                            ? "#8b7355"
                            : cat === "personal"
                              ? "#6b8e6b"
                              : "var(--stone-gray)",
                    }}
                    title={`${categoryLabels[cat]}: ${pct}%`}
                  />
                );
              })}
            </div>
          </div>
        </FadeIn>

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.35 }}
        >
          <Link href="/reviews/new">
            <Button>新建复盘</Button>
          </Link>
          <Link href="/reviews">
            <Button variant="secondary">查看全部复盘</Button>
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
