import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

  // Also extract bullet points that look like action items
  const lines = text.split("\n");
  lines.forEach((line) => {
    const trimmed = line.replace(/^[\s\-•·*>]+/, "").trim();
    if (trimmed.length >= 4 && trimmed.length <= 50) {
      const hasAction = /(?:要|需要|应该|计划|准备|完成|推进|优化|改进|学习|尝试|联系|整理|搭建|实现|测试|修复|创建|更新|添加|跟进)/.test(trimmed);
      if (hasAction) {
        found.add(trimmed);
      }
    }
  });

  return Array.from(found).slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const { reviewId, content } = body;

  let text = content || "";

  // If reviewId provided, fetch review content
  if (reviewId && !content) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { sections: true },
    });
    if (!review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }
    text = review.sections.map((s) => s.content).join("\n");
  }

  const extracted = extractActions(text);

  // Create action items for the review if reviewId provided
  if (reviewId && extracted.length > 0) {
    const created = await Promise.all(
      extracted.map((content) =>
        prisma.actionItem.create({
          data: {
            reviewId,
            content,
            status: "pending",
          },
        })
      )
    );
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
  // Get all pending action items with review context
  const pendingActions = await prisma.actionItem.findMany({
    where: { status: "pending" },
    include: {
      review: {
        select: { id: true, title: true, date: true, category: true },
      },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const overdue = pendingActions.filter((a) => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  });

  const dueSoon = pendingActions.filter((a) => {
    if (!a.dueDate) return false;
    const due = new Date(a.dueDate);
    const now = new Date();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return due > now && due.getTime() - now.getTime() < threeDays;
  });

  return NextResponse.json({
    pending: pendingActions,
    overdue,
    dueSoon,
    stats: {
      total: pendingActions.length,
      overdue: overdue.length,
      dueSoon: dueSoon.length,
    },
  });
  } catch (error) {
    console.error("GET /api/actions/extract error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
