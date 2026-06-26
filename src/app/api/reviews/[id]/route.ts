import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateReviewSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        sections: { orderBy: { order: "asc" } },
        actions: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error("GET /api/reviews/[id] error:", error);
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
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { sections, ...data } = parsed.data;

    const review = await prisma.review.update({
      where: { id },
      data: {
        ...data,
        ...(sections && {
          sections: {
            deleteMany: {},
            create: sections.map((s) => ({
              sectionTitle: s.sectionTitle,
              content: s.content,
              order: s.order,
            })),
          },
        }),
      },
      include: {
        sections: { orderBy: { order: "asc" } },
        actions: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("PUT /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
