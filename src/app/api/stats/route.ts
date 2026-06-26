import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalReviews, allReviews, allActions, recentReviews] = await Promise.all([
    prisma.review.count(),
    prisma.review.findMany({
      select: { date: true, category: true },
      orderBy: { date: "asc" },
    }),
    prisma.actionItem.findMany({
      select: { status: true, createdAt: true, completedAt: true },
    }),
    prisma.review.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { date: true },
      orderBy: { date: "asc" },
    }),
  ]);

  // Category stats
  const categoryStats = allReviews.reduce(
    (acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Action completion rate
  const totalActions = allActions.length;
  const doneActions = allActions.filter((a) => a.status === "done").length;
  const pendingActions = allActions.filter((a) => a.status === "pending").length;

  // Daily review count (last 30 days)
  const dailyCounts: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyCounts[key] = 0;
  }
  recentReviews.forEach((r) => {
    const d = r.date instanceof Date ? r.date : new Date(r.date as string);
    const key = d.toISOString().slice(0, 10);
    if (key in dailyCounts) dailyCounts[key]++;
  });

  const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({
    date: date.slice(5),
    count,
  }));

  // Review streak
  let streak = 0;
  const reviewDates = new Set(
    allReviews.map((r) =>
      (r.date instanceof Date ? r.date : new Date(r.date)).toISOString().slice(0, 10)
    )
  );
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    if (reviewDates.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Monthly stats (last 6 months)
  const monthlyStats: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyStats[key] = 0;
  }
  allReviews.forEach((r) => {
    const d = r.date instanceof Date ? r.date : new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyStats) monthlyStats[key]++;
  });
  const monthlyData = Object.entries(monthlyStats).map(([month, count]) => ({
    month,
    count,
  }));

  return NextResponse.json({
    totalReviews,
    categoryStats,
    totalActions,
    doneActions,
    pendingActions,
    completionRate: totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0,
    dailyData,
    monthlyData,
    streak,
  });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
