import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "month"; // week | month | quarter

  const now = new Date();
  let startDate: Date;
  let prevStartDate: Date;
  let format: string;

  switch (period) {
    case "week":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      format = "day";
      break;
    case "quarter":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      format = "month";
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      format = "day";
  }

  const [currentReviews, previousReviews, allReviews, allActions] = await Promise.all([
    prisma.review.findMany({
      where: { date: { gte: startDate } },
      include: { sections: true, actions: true },
      orderBy: { date: "desc" },
    }),
    prisma.review.findMany({
      where: { date: { gte: prevStartDate, lt: startDate } },
      include: { sections: true, actions: true },
    }),
    prisma.review.findMany({
      include: { sections: true, actions: true },
      orderBy: { date: "asc" },
    }),
    prisma.actionItem.findMany(),
  ]);

  // Category distribution
  const currentCategories: Record<string, number> = {};
  currentReviews.forEach((r) => {
    currentCategories[r.category] = (currentCategories[r.category] || 0) + 1;
  });

  // Keyword frequency analysis from section content
  const wordFreq: Record<string, number> = {};
  const stopWords = new Set([
    "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
    "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
    "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
    "什么", "这个", "那个", "可以", "已经", "还", "又", "把", "让", "给",
    "从", "但", "与", "为", "以", "对", "而", "及", "或", "被", "能",
    "如果", "因为", "所以", "然后", "之后", "之前", "现在", "已经", "下",
    "中", "个", "大", "小", "多", "少", "来", "做", "过", "得",
  ]);

  currentReviews.forEach((r) => {
    r.sections.forEach((s) => {
      if (!s.content) return;
      const words = s.content
        .replace(/[#*_\[\]()>`]/g, " ")
        .split(/[\s,，。、；：！？\n]+/)
        .filter((w) => w.length >= 2 && !stopWords.has(w));
      words.forEach((w) => {
        wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });
  });

  const topKeywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  // Review frequency trend (current period, grouped by day)
  const dailyTrend: Record<string, number> = {};
  currentReviews.forEach((r) => {
    const d = r.date instanceof Date ? r.date : new Date(r.date);
    const key = format === "day" ? d.toISOString().slice(5, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    dailyTrend[key] = (dailyTrend[key] || 0) + 1;
  });

  // Action completion rate comparison
  const currentActionDone = currentReviews.reduce(
    (sum, r) => sum + r.actions.filter((a) => a.status === "done").length,
    0
  );
  const currentActionTotal = currentReviews.reduce((sum, r) => sum + r.actions.length, 0);
  const prevActionDone = previousReviews.reduce(
    (sum, r) => sum + r.actions.filter((a) => a.status === "done").length,
    0
  );
  const prevActionTotal = previousReviews.reduce((sum, r) => sum + r.actions.length, 0);

  // Recurring themes — find keywords that appear in multiple reviews
  const keywordReviewMap: Record<string, Set<string>> = {};
  currentReviews.forEach((r) => {
    const words = new Set<string>();
    r.sections.forEach((s) => {
      if (!s.content) return;
      s.content
        .replace(/[#*_\[\]()>`]/g, " ")
        .split(/[\s,，。、；：！？\n]+/)
        .filter((w) => w.length >= 2 && !stopWords.has(w))
        .forEach((w) => words.add(w));
    });
    words.forEach((w) => {
      if (!keywordReviewMap[w]) keywordReviewMap[w] = new Set();
      keywordReviewMap[w].add(r.id);
    });
  });

  const recurringThemes = Object.entries(keywordReviewMap)
    .filter(([, ids]) => ids.size >= 2)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10)
    .map(([keyword, ids]) => ({ keyword, reviewCount: ids.size }));

  // Longest review streak in current period
  let streak = 0;
  const dates = new Set(
    currentReviews.map((r) => {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      return d.toISOString().slice(0, 10);
    })
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 90; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    if (dates.has(d.toISOString().slice(0, 10))) streak++;
    else if (i > 0) break;
  }

  return NextResponse.json({
    period,
    summary: {
      currentCount: currentReviews.length,
      previousCount: previousReviews.length,
      changePercent:
        previousReviews.length > 0
          ? Math.round(((currentReviews.length - previousReviews.length) / previousReviews.length) * 100)
          : 0,
      streak,
      actionCompletionRate:
        currentActionTotal > 0 ? Math.round((currentActionDone / currentActionTotal) * 100) : 0,
      prevActionCompletionRate:
        prevActionTotal > 0 ? Math.round((prevActionDone / prevActionTotal) * 100) : 0,
    },
    categories: currentCategories,
    topKeywords,
    recurringThemes,
    dailyTrend: Object.entries(dailyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count })),
  });
  } catch (error) {
    console.error("GET /api/insights error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
