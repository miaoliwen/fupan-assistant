import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const stopWords = new Set([
  "的", "了", "在", "是", "我", "有", "和", "就", "不", "人", "都", "一",
  "一个", "上", "也", "很", "到", "说", "要", "去", "你", "会", "着",
  "没有", "看", "好", "自己", "这", "他", "她", "它", "们", "那", "些",
  "什么", "这个", "那个", "可以", "已经", "还", "又", "把", "让", "给",
  "从", "但", "与", "为", "以", "对", "而", "及", "或", "被", "能",
  "如果", "因为", "所以", "然后", "之后", "之前", "现在", "已经", "下",
  "中", "个", "大", "小", "多", "少", "来", "做", "过", "得",
  "进行", "通过", "以及", "需要", "完成", "相关", "开始", "方面", "工作",
]);

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

    // 获取复盘记录（包含章节和行动项）
    const { data: reviews, error: reviewsError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(100);

    if (reviewsError) {
      console.error("Get reviews error:", reviewsError);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    // Build keyword nodes
    const reviewKeywordMap: Record<
      string,
      { keywords: string[]; date: string; category: string }
    > = {};
    const keywordCount: Record<string, number> = {};
    const keywordCoOccur: Record<string, Record<string, number>> = {};

    (reviews || []).forEach(
      (r: {
        id: string;
        date: string;
        category: string;
        sections: { content: string }[];
      }) => {
        const words = new Set<string>();
        r.sections.forEach((s: { content: string }) => {
          if (!s.content) return;
          s.content
            .replace(/[#*_\[\]()>`]/g, " ")
            .split(/[\s,，。、；：！？\n]+/)
            .filter(
              (w: string) =>
                w.length >= 2 && w.length <= 6 && !stopWords.has(w)
            )
            .forEach((w: string) => words.add(w));
        });

        const keywordList = Array.from(words);
        reviewKeywordMap[r.id] = {
          keywords: keywordList,
          date: new Date(r.date).toISOString().slice(0, 10),
          category: r.category,
        };

        keywordList.forEach((w) => {
          keywordCount[w] = (keywordCount[w] || 0) + 1;
        });

        // Co-occurrence
        for (let i = 0; i < keywordList.length; i++) {
          for (let j = i + 1; j < keywordList.length; j++) {
            const a = keywordList[i];
            const b = keywordList[j];
            if (!keywordCoOccur[a]) keywordCoOccur[a] = {};
            if (!keywordCoOccur[b]) keywordCoOccur[b] = {};
            keywordCoOccur[a][b] = (keywordCoOccur[a][b] || 0) + 1;
            keywordCoOccur[b][a] = (keywordCoOccur[b][a] || 0) + 1;
          }
        }
      }
    );

    // Build nodes
    const topKeywords = Object.entries(keywordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([word, count]) => ({
        id: `kw-${word}`,
        label: word,
        type: "keyword" as const,
        count,
      }));

    const reviewNodes = (reviews || [])
      .slice(0, 50)
      .map(
        (r: {
          id: string;
          title: string;
          category: string;
          date: string;
        }) => ({
          id: `rv-${r.id}`,
          label: r.title,
          type: "review" as const,
          category: r.category,
          date: new Date(r.date).toISOString().slice(0, 10),
        })
      );

    // Build edges
    const topKeywordSet = new Set(topKeywords.map((k) => k.label));
    const edges: { source: string; target: string; weight: number }[] = [];
    const edgeSet = new Set<string>();

    Object.entries(keywordCoOccur).forEach(([a, neighbors]) => {
      if (!topKeywordSet.has(a)) return;
      Object.entries(neighbors).forEach(([b, weight]) => {
        if (!topKeywordSet.has(b) || weight < 2) return;
        const key = [a, b].sort().join("---");
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edges.push({ source: `kw-${a}`, target: `kw-${b}`, weight });
        }
      });
    });

    // Keyword-review links
    (reviews || []).slice(0, 50).forEach((r: { id: string }) => {
      const info = reviewKeywordMap[r.id];
      info.keywords.forEach((kw) => {
        if (topKeywordSet.has(kw)) {
          const key = [`rv-${r.id}`, `kw-${kw}`].sort().join("---");
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            edges.push({
              source: `rv-${r.id}`,
              target: `kw-${kw}`,
              weight: 1,
            });
          }
        }
      });
    });

    // Action-review links
    const reviewActionCount: Record<string, number> = {};
    (reviews || []).forEach(
      (r: { id: string; actions: unknown[] }) => {
        reviewActionCount[`rv-${r.id}`] = r.actions.length;
      }
    );

    return NextResponse.json({
      nodes: [...topKeywords, ...reviewNodes],
      edges,
      stats: {
        totalReviews: reviews?.length || 0,
        totalKeywords: Object.keys(keywordCount).length,
        topKeywords: topKeywords
          .slice(0, 10)
          .map((k) => ({ word: k.label, count: k.count })),
      },
    });
  } catch (error) {
    console.error("GET /api/graph error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
