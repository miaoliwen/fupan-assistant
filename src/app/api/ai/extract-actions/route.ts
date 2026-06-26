import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 功能未配置，请设置 ANTHROPIC_API_KEY" }, { status: 503 });
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ error: "缺少 reviewId" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { sections: true, actions: true },
    });

    if (!review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    const existingActions = review.actions.map((a) => a.content).join("\n");
    const reviewContent = review.sections.map((s) => `## ${s.sectionTitle}\n${s.content}`).join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: `你是一个行动项提取专家。从复盘内容中提取具体的、可执行的下一步行动。

要求：
1. 每个行动项必须是具体可执行的动作，不要泛泛而谈
2. 每个行动项应附带合理的截止日期（基于内容中的时间线索，如果没有则推算一个合理的日期）
3. 返回 JSON 数组，每项包含 content（行动内容）和 dueDate（ISO 日期字符串，可以为 null）
4. 与已有行动项去重，不要重复提取
5. 最多提取 5 个最有价值的行动项

返回格式：严格只返回 JSON，不加任何解释。例如：
[{"content": "完成方案设计文档", "dueDate": "2025-06-02"}, {"content": "与团队对齐需求", "dueDate": null}]`,
      messages: [
        {
          role: "user",
          content: `## 复盘内容\n\n${reviewContent}\n\n## 已有的行动项（请勿重复）\n\n${existingActions || "无"}`,
        },
      ],
    });

    const textContent = message.content[0].type === "text" ? message.content[0].text : "[]";
    let actions: { content: string; dueDate: string | null }[] = [];
    try {
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      actions = JSON.parse(jsonMatch ? jsonMatch[0] : textContent);
    } catch {
      actions = [];
    }

    if (actions.length > 0) {
      const existingContents = new Set(review.actions.map((a) => a.content));
      const newActions = actions.filter((a) => !existingContents.has(a.content));

      const created = await Promise.all(
        newActions.map((a) =>
          prisma.actionItem.create({
            data: {
              reviewId,
              content: a.content,
              dueDate: a.dueDate ? new Date(a.dueDate) : null,
              status: "pending",
            },
          })
        )
      );

      return NextResponse.json({ extracted: newActions, created });
    }

    return NextResponse.json({ extracted: actions, created: [] });
  } catch (error) {
    console.error("POST /api/ai/extract-actions error:", error);
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 500 });
  }
}
