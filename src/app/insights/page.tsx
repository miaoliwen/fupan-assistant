"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
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

interface InsightData {
  period: string;
  summary: {
    currentCount: number;
    previousCount: number;
    changePercent: number;
    streak: number;
    actionCompletionRate: number;
    prevActionCompletionRate: number;
  };
  categories: Record<string, number>;
  topKeywords: { word: string; count: number }[];
  recurringThemes: { keyword: string; reviewCount: number }[];
  dailyTrend: { date: string; count: number }[];
}

interface AISummary {
  summary: string;
  highlights: string[];
  patterns: string[];
  suggestions: string[];
}

const categoryLabels: Record<string, string> = {
  work: "工作",
  project: "项目",
  personal: "个人",
  custom: "自定义",
};

export default function InsightsPage() {
  const [data, setData] = useState<InsightData | null>(null);
  const [period, setPeriod] = useState("month");
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/insights?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((err) => console.error("加载洞察数据失败:", err));
    setAiSummary(null);
  }, [period]);

  const generateAISummary = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/insight-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        setAiSummary({ summary: err.error || "生成失败，请稍后再试", highlights: [], patterns: [], suggestions: [] });
        return;
      }
      const result = await res.json();
      // 验证数据结构完整性
      setAiSummary({
        summary: result.summary || "暂无分析",
        highlights: Array.isArray(result.highlights) ? result.highlights : [],
        patterns: Array.isArray(result.patterns) ? result.patterns : [],
        suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
      });
    } catch {
      setAiSummary({ summary: "生成失败，请稍后再试", highlights: [], patterns: [], suggestions: [] });
    }
    setAiLoading(false);
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

  const { summary, topKeywords, recurringThemes, dailyTrend, categories } = data;
  const completionChange = summary.actionCompletionRate - summary.prevActionCompletionRate;

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        <FadeIn delay={0}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-3">
            <h1
              className="font-serif"
              style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
            >
              周期性洞察
            </h1>
            <div className="flex gap-2 font-ui">
              {(["week", "month", "quarter"] as const).map((p) => (
                <motion.button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 text-sm rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    backgroundColor: period === p ? "var(--terracotta)" : "var(--warm-sand)",
                    color: period === p ? "var(--ivory)" : "var(--charcoal-warm)",
                  }}
                >
                  {{ week: "本周", month: "本月", quarter: "本季" }[p]}
                </motion.button>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Summary Cards */}
        <StaggerReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <StaggerItem>
              <HoverCard className="p-4 sm:p-5 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>复盘数</p>
                <p className="font-serif" style={{ fontSize: "24px", fontWeight: 500, color: "var(--near-black)" }}>
                  <NumberTicker value={summary.currentCount} />
                </p>
                <motion.p
                  className="text-xs mt-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 80, damping: 24 }}
                  style={{ color: summary.changePercent >= 0 ? "var(--terracotta)" : "var(--stone-gray)" }}
                >
                  {summary.changePercent >= 0 ? "+" : ""}{summary.changePercent}% 较上期
                </motion.p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="p-4 sm:p-5 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>连续复盘</p>
                <p className="font-serif" style={{ fontSize: "24px", fontWeight: 500, color: "var(--terracotta)" }}>
                  <NumberTicker value={summary.streak} /> 天
                </p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="p-4 sm:p-5 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>行动完成率</p>
                <p className="font-serif" style={{ fontSize: "24px", fontWeight: 500, color: "var(--near-black)" }}>
                  <NumberTicker value={summary.actionCompletionRate} />%
                </p>
                <motion.p
                  className="text-xs mt-1"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 80, damping: 24 }}
                  style={{ color: completionChange >= 0 ? "var(--terracotta)" : "var(--stone-gray)" }}
                >
                  {completionChange >= 0 ? "+" : ""}{completionChange}% 较上期
                </motion.p>
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard className="p-4 sm:p-5 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>高频主题</p>
                <p className="font-serif" style={{ fontSize: "24px", fontWeight: 500, color: "var(--near-black)" }}>
                  <NumberTicker value={recurringThemes.length} />
                </p>
              </HoverCard>
            </StaggerItem>
          </div>
        </StaggerReveal>

        {/* AI Summary */}
        <FadeIn delay={0.15}>
          <motion.div
            className="p-5 sm:p-6 mb-5 sm:mb-6 font-ui"
            style={{
              backgroundColor: "var(--ivory)",
              borderRadius: "12px",
              border: "1px solid var(--border-cream)",
              backgroundImage: "linear-gradient(135deg, rgba(201,100,66,0.03) 0%, transparent 50%)",
            }}
            whileHover={{ boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
                AI 深度分析
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={generateAISummary}
                disabled={aiLoading}
              >
                {aiLoading ? "分析中..." : aiSummary ? "重新分析" : "生成 AI 分析"}
              </Button>
            </div>

            {aiSummary ? (
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 80, damping: 24 }}
              >
                <p className="text-sm" style={{ color: "var(--olive-gray)", lineHeight: 1.7 }}>
                  {aiSummary.summary}
                </p>

                {aiSummary.highlights?.length > 0 && (
                  <div>
                    <p className="text-xs mb-2 font-medium" style={{ color: "var(--terracotta)" }}>亮点</p>
                    <div className="flex flex-wrap gap-2">
                      {aiSummary.highlights.map((h, i) => (
                        <motion.span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05, type: "spring", stiffness: 100, damping: 20 }}
                          style={{ backgroundColor: "rgba(201,100,66,0.1)", color: "var(--terracotta)" }}
                        >
                          {h}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                )}

                {aiSummary.patterns?.length > 0 && (
                  <div>
                    <p className="text-xs mb-2 font-medium" style={{ color: "var(--olive-gray)" }}>发现的模式</p>
                    <ul className="space-y-1">
                      {aiSummary.patterns.map((p, i) => (
                        <motion.li
                          key={i}
                          className="text-sm flex items-start gap-2"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, type: "spring", stiffness: 80, damping: 24 }}
                          style={{ color: "var(--olive-gray)" }}
                        >
                          <span style={{ color: "var(--terracotta)" }}>·</span>
                          {p}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}

                {aiSummary.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs mb-2 font-medium" style={{ color: "var(--near-black)" }}>改进建议</p>
                    <ul className="space-y-1">
                      {aiSummary.suggestions.map((s, i) => (
                        <motion.li
                          key={i}
                          className="text-sm flex items-start gap-2"
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04, type: "spring", stiffness: 80, damping: 24 }}
                          style={{ color: "var(--near-black)" }}
                        >
                          <span className="font-medium" style={{ color: "var(--terracotta)" }}>{i + 1}.</span>
                          {s}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-sm" style={{ color: "var(--stone-gray)", lineHeight: 1.6 }}>
                点击「生成 AI 分析」，让 AI 基于你的复盘数据生成深度洞察报告，发现模式并给出个性化建议。
              </p>
            )}
          </motion.div>
        </FadeIn>

        {/* Daily Trend */}
        {dailyTrend.length > 0 && (
          <FadeIn delay={0.2}>
            <div className="p-6 mb-6 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
              <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
                复盘频率趋势
              </h2>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-cream)" />
                  <XAxis dataKey="date" tick={{ fill: "var(--stone-gray)", fontSize: 11 }} />
                  <YAxis tick={{ fill: "var(--stone-gray)", fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--ivory)",
                      border: "1px solid var(--border-cream)",
                      borderRadius: "8px",
                      fontSize: 13,
                    }}
                  />
                  <Line type="monotone" dataKey="count" name="复盘数" stroke="var(--terracotta)" strokeWidth={2} dot={{ fill: "var(--terracotta)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </FadeIn>
        )}

        {/* Recurring Themes */}
        {recurringThemes.length > 0 && (
          <FadeIn delay={0.25}>
            <div className="p-6 mb-6 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
              <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
                反复出现的主题
              </h2>
              <p className="text-xs mb-4" style={{ color: "var(--stone-gray)" }}>
                这些关键词在多篇复盘中反复出现，可能代表你当前阶段的核心关注点
              </p>
              <div className="flex flex-wrap gap-2">
                {recurringThemes.map((t) => (
                  <motion.div
                    key={t.keyword}
                    className="px-3 py-1.5 rounded-full"
                    whileHover={{ scale: 1.05 }}
                    style={{
                      backgroundColor: t.reviewCount >= 4 ? "var(--terracotta)" : t.reviewCount >= 3 ? "#d4b89a" : "var(--warm-sand)",
                      color: t.reviewCount >= 4 ? "var(--ivory)" : "var(--charcoal-warm)",
                      fontSize: "13px",
                    }}
                  >
                    {t.keyword}
                    <span className="ml-1 opacity-70">{t.reviewCount} 篇</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Top Keywords */}
        {topKeywords.length > 0 && (
          <FadeIn delay={0.3}>
            <div className="p-6 mb-6 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
              <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
                高频关键词
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topKeywords.slice(0, 12)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-cream)" />
                  <XAxis type="number" tick={{ fill: "var(--stone-gray)", fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="word" tick={{ fill: "var(--olive-gray)", fontSize: 12 }} width={70} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--ivory)",
                      border: "1px solid var(--border-cream)",
                      borderRadius: "8px",
                      fontSize: 13,
                    }}
                  />
                  <Bar dataKey="count" name="出现次数" fill="var(--terracotta)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FadeIn>
        )}

        {/* Categories */}
        {Object.keys(categories).length > 0 && (
          <FadeIn delay={0.35}>
            <div className="p-6 mb-8 font-ui" style={{ backgroundColor: "var(--ivory)", borderRadius: "12px", border: "1px solid var(--border-cream)" }}>
              <h2 className="font-serif mb-4" style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}>
                分类分布
              </h2>
              <div className="flex gap-4 flex-wrap mb-3">
                {Object.entries(categories).map(([cat, count]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span style={{ color: "var(--olive-gray)" }}>
                      {categoryLabels[cat] || cat}: <strong style={{ color: "var(--near-black)" }}>{count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        <motion.div
          className="flex gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 80, damping: 24, delay: 0.4 }}
        >
          <Link href="/graph">
            <Button variant="secondary">查看知识图谱</Button>
          </Link>
          <Link href="/actions">
            <Button variant="secondary">管理行动项</Button>
          </Link>
        </motion.div>
      </div>
    </PageTransition>
  );
}
