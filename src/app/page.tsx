"use client";

import { useEffect, useState } from "react";
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
} from "@/components/motion/MotionElements";

interface Review {
  id: string;
  title: string;
  date: string;
  category: string;
  actions: { id: string; status: string }[];
}

export default function HomePage() {
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total: 0, pendingActions: 0 });

  useEffect(() => {
    fetch("/api/reviews?limit=5")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setRecentReviews(data.reviews || []);
        const pending = (data.reviews || []).reduce(
          (sum: number, r: Review) =>
            sum + r.actions.filter((a) => a.status === "pending").length,
          0
        );
        setStats({ total: data.pagination?.total || 0, pendingActions: pending });
      })
      .catch((err) => console.error("加载复盘列表失败:", err));
  }, []);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <FadeIn delay={0}>
          <div className="mb-8 sm:mb-10">
            <h1
              className="font-serif mb-2"
              style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
            >
              复盘助手
            </h1>
            <p className="font-ui" style={{ color: "var(--olive-gray)", fontSize: "15px", lineHeight: 1.6 }}>
              通过结构化的复盘，发现成长规律，持续改进
            </p>
          </div>
        </FadeIn>

        <StaggerReveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
            <StaggerItem>
              <HoverCard
                className="p-4 sm:p-5 font-ui"
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-cream)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>总复盘数</p>
                <NumberTicker
                  value={stats.total}
                  className="font-serif"
                  style={{ fontSize: "26px", fontWeight: 500, color: "var(--near-black)" }}
                />
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard
                className="p-4 sm:p-5 font-ui"
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-cream)",
                }}
              >
                <p className="text-xs mb-1" style={{ color: "var(--stone-gray)" }}>待办行动项</p>
                <NumberTicker
                  value={stats.pendingActions}
                  className="font-serif"
                  style={{ fontSize: "26px", fontWeight: 500, color: "var(--terracotta)" }}
                />
              </HoverCard>
            </StaggerItem>
            <StaggerItem>
              <HoverCard
                className="p-4 sm:p-5 flex items-center font-ui"
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-cream)",
                }}
              >
                <Link href="/reviews/new" className="w-full">
                  <Button className="w-full">新建复盘</Button>
                </Link>
              </HoverCard>
            </StaggerItem>
          </div>
        </StaggerReveal>

        <FadeIn delay={0.2}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-serif"
                style={{ fontSize: "18px", fontWeight: 500, color: "var(--near-black)" }}
              >
                最近复盘
              </h2>
              <Link
                href="/reviews"
                className="font-ui text-sm transition-colors"
                style={{ color: "var(--terracotta)" }}
              >
                查看全部 →
              </Link>
            </div>

            {recentReviews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="p-8 sm:p-10 text-center font-ui"
                style={{
                  backgroundColor: "var(--ivory)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-cream)",
                }}
              >
                <p className="mb-4" style={{ color: "var(--stone-gray)" }}>还没有复盘记录</p>
                <Link href="/reviews/new">
                  <Button>开始第一次复盘</Button>
                </Link>
              </motion.div>
            ) : (
              <StaggerReveal>
                <div className="space-y-2">
                  {recentReviews.map((review) => (
                    <StaggerItem key={review.id}>
                      <HoverCard as="a" href={`/reviews/${review.id}`}>
                        <div
                          className="block p-3 sm:p-4 font-ui"
                          style={{
                            backgroundColor: "var(--ivory)",
                            borderRadius: "8px",
                            border: "1px solid var(--border-cream)",
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1 mr-2">
                              <h3 className="text-sm truncate" style={{ color: "var(--near-black)", fontWeight: 500 }}>
                                {review.title}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: "var(--stone-gray)" }}>
                                {formatDate(review.date)}
                              </p>
                            </div>
                            {review.actions.some((a) => a.status === "pending") && (
                              <Badge variant="warning" className="shrink-0">有待办</Badge>
                            )}
                          </div>
                        </div>
                      </HoverCard>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerReveal>
            )}
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
