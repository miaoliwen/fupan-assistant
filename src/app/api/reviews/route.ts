import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReviewSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20") || 20));
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.slice(0, 200);

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { sections: { some: { content: { contains: search } } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          sections: { orderBy: { order: "asc" } },
          actions: true,
        },
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, templateId, category, sections } = parsed.data;

    const review = await prisma.review.create({
      data: {
        title,
        templateId,
        category,
        sections: {
          create: sections.map((s) => ({
            sectionTitle: s.sectionTitle,
            content: s.content,
            order: s.order,
          })),
        },
      },
      include: {
        sections: { orderBy: { order: "asc" } },
        actions: true,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
