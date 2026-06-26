import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createActionSchema, updateActionSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const actions = await prisma.actionItem.findMany({
      where: { reviewId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error("GET /api/reviews/[id]/actions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = createActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const action = await prisma.actionItem.create({
      data: {
        reviewId: id,
        content: parsed.data.content,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      },
    });

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews/[id]/actions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { dueDate, ...data } = parsed.data;

    // 从请求体中获取 actionId，而非使用 URL 中的 reviewId
    const actionId = body.id;
    if (!actionId) {
      return NextResponse.json({ error: "缺少行动项 ID" }, { status: 400 });
    }

    // 验证该 actionItem 属于此 review
    const existing = await prisma.actionItem.findFirst({
      where: { id: actionId, reviewId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "行动项未找到" }, { status: 404 });
    }

    const action = await prisma.actionItem.update({
      where: { id: actionId },
      data: {
        ...data,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        completedAt: data.status === "done" ? new Date() : undefined,
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("PUT /api/reviews/[id]/actions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

// DELETE 操作由 /api/reviews/[id]/actions/[actionId]/route.ts 处理
