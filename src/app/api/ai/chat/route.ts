import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI 功能未配置，请设置 ANTHROPIC_API_KEY" }, { status: 503 });
    }

    const body = await request.json();
    const { reviewId, messages } = body;

    if (!reviewId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { sections: true, actions: true },
    });

    if (!review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    const reviewContent = review.sections
      .map((s) => `## ${s.sectionTitle}\n${s.content || "(未填写)"}`)
      .join("\n\n");

    const actionList = review.actions
      .map((a) => `- [${a.status === "done" ? "x" : " "}] ${a.content}${a.dueDate ? ` (截止: ${a.dueDate instanceof Date ? a.dueDate.toISOString().slice(0, 10) : a.dueDate})` : ""}`)
      .join("\n");

    const systemPrompt = `你是复盘助手 AI，帮助用户深入反思和改进。

你已经了解当前这篇复盘的内容，你可以：
1. 针对复盘内容提出深入的追问，帮助用户思考更深层的原因
2. 帮助用户完善某个板块的内容
3. 从复盘中提取洞察和建议
4. 帮助用户制定更具体的行动计划
5. 将用户的反思与过往复盘关联，发现长期模式

当前复盘信息：
- 标题: ${review.title}
- 日期: ${review.date instanceof Date ? review.date.toISOString().slice(0, 10) : review.date}
- 分类: ${review.category}

复盘内容：
${reviewContent}

行动项：
${actionList || "暂无"}

保持温暖、有建设性的语气。回答简洁明了，用中文回复。`;

    const chatMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: chatMessages,
    });

    const reply =
      response.content[0].type === "text"
        ? response.content[0].text
        : "抱歉，我暂时无法回复。请稍后再试。";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("POST /api/ai/chat error:", error);
    return NextResponse.json({ error: "AI 服务暂时不可用" }, { status: 500 });
  }
}
