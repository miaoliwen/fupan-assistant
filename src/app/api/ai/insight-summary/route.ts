import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

const periodDays: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
};

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI 功能未配置，请设置 ANTHROPIC_API_KEY" },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const { period = "month" } = body;

    const days = periodDays[period] || 30;
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000
    ).toISOString();

    // 获取复盘记录
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
      .gte("date", since)
      .order("date", { ascending: false });

    if (reviewsError) {
      console.error("Get reviews error:", reviewsError);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        summary: "这段时间还没有复盘记录，开始写第一篇复盘吧！",
        highlights: [],
        patterns: [],
        suggestions: ["尝试每天或每周花 10 分钟写复盘"],
      });
    }

    const reviewTexts = reviews
      .map(
        (r: {
          title: string;
          date: string;
          sections: { section_title: string; content: string }[];
        }) =>
          `### ${r.title} (${r.date.slice(0, 10)})\n${r.sections.map((s: { section_title: string; content: string }) => `**${s.section_title}:** ${s.content}`).join("\n")}`
      )
      .join("\n\n");

    const actionStats = {
      total: reviews.reduce(
        (sum: number, r: { actions: unknown[] }) => sum + r.actions.length,
        0
      ),
      done: reviews.reduce(
        (sum: number, r: { actions: { status: string }[] }) =>
          sum +
          r.actions.filter((a: { status: string }) => a.status === "done")
            .length,
        0
      ),
      pending: reviews.reduce(
        (sum: number, r: { actions: { status: string }[] }) =>
          sum +
          r.actions.filter((a: { status: string }) => a.status === "pending")
            .length,
        0
      ),
    };

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `你是一位资深的个人成长教练和复盘分析师。根据用户的复盘数据，生成一份有深度的周期性洞察报告。

要求：
1. 总结这段时间的核心趋势和变化
2. 发现反复出现的主题和模式
3. 指出做得好的方面和需要改进的地方
4. 给出 2-3 条具体的改进建议
5. 语气温暖、鼓励、有建设性

返回 JSON 格式：
{
  "summary": "2-3句话的总体评价",
  "highlights": ["亮点1", "亮点2"],
  "patterns": ["发现的模式1", "发现的模式2"],
  "suggestions": ["建议1", "建议2", "建议3"]
}

严格只返回 JSON。`,
      messages: [
        {
          role: "user",
          content: `## 周期内的复盘记录（共 ${reviews.length} 篇）

${reviewTexts}

## 行动项统计
- 总计: ${actionStats.total} 个行动项
- 已完成: ${actionStats.done} 个
- 待完成: ${actionStats.pending} 个
- 完成率: ${actionStats.total > 0 ? Math.round((actionStats.done / actionStats.total) * 100) : 0}%`,
        },
      ],
    });

    const textContent =
      message.content[0].type === "text" ? message.content[0].text : "{}";
    let result: {
      summary?: string;
      highlights?: string[];
      patterns?: string[];
      suggestions?: string[];
    } = {};
    try {
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : textContent);
    } catch {
      result = {
        summary: textContent,
        highlights: [],
        patterns: [],
        suggestions: [],
      };
    }

    // 确保返回的数据结构完整
    return NextResponse.json({
      summary: result.summary || "暂无分析",
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
      patterns: Array.isArray(result.patterns) ? result.patterns : [],
      suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
    });
  } catch (error) {
    console.error("POST /api/ai/insight-summary error:", error);
    return NextResponse.json(
      { error: "AI 服务暂时不可用" },
      { status: 500 }
    );
  }
}
