import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const { id, actionId } = await params;

    // 验证该 actionItem 属于此 review
    const existing = await prisma.actionItem.findFirst({
      where: { id: actionId, reviewId: id },
    });
    if (!existing) {
      return NextResponse.json({ error: "行动项未找到" }, { status: 404 });
    }

    await prisma.actionItem.delete({ where: { id: actionId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id]/actions/[actionId] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
