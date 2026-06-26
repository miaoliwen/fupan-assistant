import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const actionPatterns = [
  /(?:需要|应该|要|计划|准备|打算|考虑|尝试|学习|优化|改进|完成|推进|落实|跟进|确认|联系|整理|复盘|总结|搭建|构建|实现|开发|测试|发布|升级|修复|解决|创建|删除|修改|更新|添加|删除)[\w\s，,。、]{2,30}/g,
  /(?:下周|明天|本周|之后|接下来|后续|尽快)[\w\s，,。、]{2,30}/g,
  /(?:1\.|2\.|3\.|4\.|5\.|[（(][\d]+[)）])[\s]*[\w]{2,30}/g,
];

function extractActions(text: string): string[] {
  const found = new Set<string>();
  actionPatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((m) => {
        const cleaned = m.replace(/[#*_\[\]()>`]/g, "").trim();
        if (cleaned.length >= 4 && cleaned.length <= 50) {
          found.add(cleaned);
        }
      });
    }
  });

  // 提取看起来像行动项的列表项
  const lines = text.split("\n");
  lines.forEach((line) => {
    const trimmed = line.replace(/^[\s\-•·*>]+/, "").trim();
    if (trimmed.length >= 4 && trimmed.length <= 50) {
      const hasAction =
        /(?:要|需要|应该|计划|准备|完成|推进|优化|改进|学习|尝试|联系|整理|搭建|实现|测试|修复|创建|更新|添加|跟进)/.test(
          trimmed
        );
      if (hasAction) {
        found.add(trimmed);
      }
    }
  });

  return Array.from(found).slice(0, 10);
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { reviewId, content } = body;

    let text = content || "";

    // 如果提供了 reviewId，获取复盘内容
    if (reviewId && !content) {
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .select(
          `
          *,
          sections:review_sections(*)
        `
        )
        .eq("id", reviewId)
        .eq("user_id", user.id)
        .single();

      if (reviewError || !review) {
        return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
      }
      text = review.sections
        .map((s: { content: string }) => s.content)
        .join("\n");
    }

    const extracted = extractActions(text);

    // 如果提供了 reviewId，创建行动项
    if (reviewId && extracted.length > 0) {
      const created = [];
      for (const actionContent of extracted) {
        const { data, error } = await supabase
          .from("action_items")
          .insert({
            review_id: reviewId,
            content: actionContent,
            status: "pending",
          })
          .select()
          .single();

        if (!error && data) {
          created.push(data);
        }
      }
      return NextResponse.json({ extracted, created });
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error("POST /api/actions/extract error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

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

    // 获取待处理的行动项（包含复盘信息）
    const { data: pendingActions, error: actionsError } = await supabase
      .from("action_items")
      .select(
        `
        *,
        review:reviews(id, title, date, category)
      `
      )
      .eq("review.user_id", user.id)
      .eq("status", "pending")
      .order("due_date", { ascending: true })
      .order("created_at", { ascending: false });

    if (actionsError) {
      console.error("Get actions error:", actionsError);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    const overdue = (pendingActions || []).filter(
      (a: { due_date: string | null }) => {
        if (!a.due_date) return false;
        return new Date(a.due_date) < now;
      }
    );

    const dueSoon = (pendingActions || []).filter(
      (a: { due_date: string | null }) => {
        if (!a.due_date) return false;
        const due = new Date(a.due_date);
        return due > now && due.getTime() - now.getTime() < threeDays;
      }
    );

    return NextResponse.json({
      pending: pendingActions || [],
      overdue,
      dueSoon,
      stats: {
        total: pendingActions?.length || 0,
        overdue: overdue.length,
        dueSoon: dueSoon.length,
      },
    });
  } catch (error) {
    console.error("GET /api/actions/extract error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
