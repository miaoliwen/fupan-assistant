import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "month"; // week | month | quarter

    const now = new Date();
    let startDate: string;
    let prevStartDate: string;
    let format: string;

    switch (period) {
      case "week":
        startDate = new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString();
        prevStartDate = new Date(
          now.getTime() - 14 * 24 * 60 * 60 * 1000
        ).toISOString();
        format = "day";
        break;
      case "quarter":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          1
        ).toISOString();
        prevStartDate = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          1
        ).toISOString();
        format = "month";
        break;
      default:
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        ).toISOString();
        prevStartDate = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        ).toISOString();
        format = "day";
    }

    // 获取当前周期的复盘记录
    const { data: currentReviews } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("user_id", user.id)
      .gte("date", startDate)
      .order("date", { ascending: false });

    // 获取上一周期的复盘记录
    const { data: previousReviews } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("user_id", user.id)
      .gte("date", prevStartDate)
      .lt("date", startDate);

    // 获取所有复盘记录
    const { data: allReviews } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("user_id", user.id)
      .order("date", { ascending: true });

    // 分类分布
    const currentCategories: Record<string, number> = {};
    (currentReviews || []).forEach((r: { category: string }) => {
      currentCategories[r.category] =
        (currentCategories[r.category] || 0) + 1;
    });

    // 关键词频率分析
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

    (currentReviews || []).forEach(
      (r: { sections: { content: string }[] }) => {
        r.sections.forEach((s: { content: string }) => {
          if (!s.content) return;
          const words = s.content
            .replace(/[#*_\[\]()>`]/g, " ")
            .split(/[\s,，。、；：！？\n]+/)
            .filter(
              (w: string) => w.length >= 2 && !stopWords.has(w)
            );
          words.forEach((w: string) => {
            wordFreq[w] = (wordFreq[w] || 0) + 1;
          });
        });
      }
    );

    const topKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }));

    // 复盘频率趋势
    const dailyTrend: Record<string, number> = {};
    (currentReviews || []).forEach((r: { date: string }) => {
      const d = new Date(r.date);
      const key =
        format === "day"
          ? d.toISOString().slice(5, 10)
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      dailyTrend[key] = (dailyTrend[key] || 0) + 1;
    });

    // 行动项完成率对比
    const currentActionDone = (currentReviews || []).reduce(
      (sum: number, r: { actions: { status: string }[] }) =>
        sum + r.actions.filter((a: { status: string }) => a.status === "done").length,
      0
    );
    const currentActionTotal = (currentReviews || []).reduce(
      (sum: number, r: { actions: unknown[] }) => sum + r.actions.length,
      0
    );
    const prevActionDone = (previousReviews || []).reduce(
      (sum: number, r: { actions: { status: string }[] }) =>
        sum + r.actions.filter((a: { status: string }) => a.status === "done").length,
      0
    );
    const prevActionTotal = (previousReviews || []).reduce(
      (sum: number, r: { actions: unknown[] }) => sum + r.actions.length,
      0
    );

    // 反复出现的主题
    const keywordReviewMap: Record<string, Set<string>> = {};
    (currentReviews || []).forEach(
      (r: {
        id: string;
        sections: { content: string }[];
      }) => {
        const words = new Set<string>();
        r.sections.forEach((s: { content: string }) => {
          if (!s.content) return;
          s.content
            .replace(/[#*_\[\]()>`]/g, " ")
            .split(/[\s,，。、；：！？\n]+/)
            .filter(
              (w: string) => w.length >= 2 && !stopWords.has(w)
            )
            .forEach((w: string) => words.add(w));
        });
        words.forEach((w) => {
          if (!keywordReviewMap[w]) keywordReviewMap[w] = new Set();
          keywordReviewMap[w].add(r.id);
        });
      }
    );

    const recurringThemes = Object.entries(keywordReviewMap)
      .filter(([, ids]) => ids.size >= 2)
      .sort((a, b) => b[1].size - a[1].size)
      .slice(0, 10)
      .map(([keyword, ids]) => ({ keyword, reviewCount: ids.size }));

    // 连续复盘天数
    let streak = 0;
    const dates = new Set(
      (currentReviews || []).map((r: { date: string }) =>
        new Date(r.date).toISOString().slice(0, 10)
      )
    );
    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    for (let i = 0; i < 90; i++) {
      const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      if (dates.has(d.toISOString().slice(0, 10))) streak++;
      else if (i > 0) break;
    }

    return NextResponse.json({
      period,
      summary: {
        currentCount: currentReviews?.length || 0,
        previousCount: previousReviews?.length || 0,
        changePercent:
          (previousReviews?.length || 0) > 0
            ? Math.round(
                (((currentReviews?.length || 0) -
                  (previousReviews?.length || 0)) /
                  (previousReviews?.length || 1)) *
                  100
              )
            : 0,
        streak,
        actionCompletionRate:
          currentActionTotal > 0
            ? Math.round((currentActionDone / currentActionTotal) * 100)
            : 0,
        prevActionCompletionRate:
          prevActionTotal > 0
            ? Math.round((prevActionDone / prevActionTotal) * 100)
            : 0,
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
