"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import {
  PageTransition,
  StaggerReveal,
  StaggerItem,
  FadeIn,
  HoverCard,
  motion,
  AnimatePresence,
} from "@/components/motion/MotionElements";

interface Review {
  id: string;
  title: string;
  date: string;
  category: string;
  tags: string;
  sections: { sectionTitle: string; content: string }[];
  actions: { id: string; status: string }[];
}

const categoryLabels: Record<string, string> = {
  work: "工作",
  project: "项目",
  personal: "个人",
  custom: "自定义",
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchReviews = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    fetch(`/api/reviews?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("加载复盘列表失败:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
  }, [category]);

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <FadeIn delay={0}>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h1
              className="font-serif"
              style={{ fontSize: "28px", fontWeight: 500, color: "var(--near-black)", lineHeight: 1.2 }}
            >
              复盘记录
            </h1>
            <Link href="/reviews/new">
              <Button>新建复盘</Button>
            </Link>
          </div>
        </FadeIn>

        <FadeIn delay={0.08}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-6 sm:mb-8">
            <div className="flex gap-2 flex-1">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索复盘内容..."
                className="flex-1 min-w-0"
                onKeyDown={(e) => e.key === "Enter" && fetchReviews()}
              />
              <Button variant="secondary" onClick={fetchReviews} className="shrink-0">
                搜索
              </Button>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="font-ui text-sm w-full sm:w-auto"
              style={{
                backgroundColor: "var(--pure-white)",
                borderColor: "var(--border-warm)",
                borderRadius: "12px",
                padding: "8px 12px",
                color: "var(--near-black)",
                border: "1px solid var(--border-warm)",
              }}
            >
              <option value="">全部分类</option>
              <option value="work">工作</option>
              <option value="project">项目</option>
              <option value="personal">个人</option>
              <option value="custom">自定义</option>
            </select>
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 font-ui"
              style={{ color: "var(--stone-gray)" }}
            >
              加载中...
            </motion.p>
          ) : reviews.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="p-8 sm:p-10 text-center font-ui"
              style={{
                backgroundColor: "var(--ivory)",
                borderRadius: "12px",
                border: "1px solid var(--border-cream)",
              }}
            >
              <p className="mb-4" style={{ color: "var(--stone-gray)" }}>暂无复盘记录</p>
              <Link href="/reviews/new">
                <Button>创建第一个复盘</Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StaggerReveal>
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <StaggerItem key={review.id}>
                      <HoverCard as="a" href={`/reviews/${review.id}`}>
                        <div
                          className="block p-4 sm:p-5 font-ui"
                          style={{
                            backgroundColor: "var(--ivory)",
                            borderRadius: "12px",
                            border: "1px solid var(--border-cream)",
                          }}
                        >
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="min-w-0 flex-1">
                              <h3
                                className="font-serif"
                                style={{ color: "var(--near-black)", fontWeight: 500, fontSize: "15px" }}
                              >
                                {review.title}
                              </h3>
                              <p className="text-xs mt-0.5" style={{ color: "var(--stone-gray)" }}>
                                {formatDate(review.date)}
                              </p>
                            </div>
                            <div className="flex gap-1.5 items-center shrink-0 flex-wrap justify-end">
                              <Badge className="text-[10px]">{categoryLabels[review.category] || review.category}</Badge>
                              {review.actions.some((a) => a.status === "pending") && (
                                <Badge variant="warning" className="text-[10px]">
                                  {review.actions.filter((a) => a.status === "pending").length} 待办
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div
                            className="text-sm line-clamp-2"
                            style={{ color: "var(--olive-gray)", lineHeight: 1.6 }}
                          >
                            {review.sections.map((s) => s.content).filter(Boolean).join(" / ")}
                          </div>
                        </div>
                      </HoverCard>
                    </StaggerItem>
                  ))}
                </div>
              </StaggerReveal>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
