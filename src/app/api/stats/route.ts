import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // 获取所有复盘记录
    const { data: allReviews, error: reviewsError } = await supabase
      .from("reviews")
      .select("id, date, category")
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    if (reviewsError) {
      console.error("Get reviews error:", reviewsError);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    // 获取所有行动项
    const reviewIds = (allReviews || []).map((r: { id: string }) => r.id);
    const { data: allActions, error: actionsError } = reviewIds.length > 0
      ? await supabase
          .from("action_items")
          .select("status, created_at, completed_at")
          .in("review_id", reviewIds)
      : { data: [], error: null };

    if (actionsError) {
      console.error("Get actions error:", actionsError);
    }

    // 获取最近30天的复盘记录
    const { data: recentReviews } = await supabase
      .from("reviews")
      .select("date")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: true });

    const totalReviews = allReviews?.length || 0;

    // 分类统计
    const categoryStats = (allReviews || []).reduce(
      (acc: Record<string, number>, r: { category: string }) => {
        acc[r.category] = (acc[r.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // 行动项统计
    const totalActions = allActions?.length || 0;
    const doneActions =
      allActions?.filter((a: { status: string }) => a.status === "done")
        .length || 0;
    const pendingActions =
      allActions?.filter((a: { status: string }) => a.status === "pending")
        .length || 0;

    // 每日复盘统计（最近30天）
    const dailyCounts: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      dailyCounts[key] = 0;
    }
    (recentReviews || []).forEach((r: { date: string }) => {
      const d = new Date(r.date);
      const key = d.toISOString().slice(0, 10);
      if (key in dailyCounts) dailyCounts[key]++;
    });

    const dailyData = Object.entries(dailyCounts).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));

    // 连续复盘天数
    let streak = 0;
    const reviewDates = new Set(
      (allReviews || []).map((r: { date: string }) =>
        new Date(r.date).toISOString().slice(0, 10)
      )
    );
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    for (let i = 0; i < 365; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      if (reviewDates.has(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // 月度统计（最近6个月）
    const monthlyStats: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyStats[key] = 0;
    }
    (allReviews || []).forEach((r: { date: string }) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in monthlyStats) monthlyStats[key]++;
    });
    const monthlyData = Object.entries(monthlyStats).map(
      ([month, count]) => ({
        month,
        count,
      })
    );

    return NextResponse.json({
      totalReviews,
      categoryStats,
      totalActions,
      doneActions,
      pendingActions,
      completionRate:
        totalActions > 0 ? Math.round((doneActions / totalActions) * 100) : 0,
      dailyData,
      monthlyData,
      streak,
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
