import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createReviewSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20") || 20)
    );
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.slice(0, 200);

    // 构建查询
    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    // 分类过滤
    if (category) {
      query = query.eq("category", category);
    }

    // 搜索过滤
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,sections.content.ilike.%${search}%`
      );
    }

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) {
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    // 获取总数
    const { count: total } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
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
    const parsed = createReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, templateId, category, sections } = parsed.data;

    // 创建复盘记录
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        title,
        template_id: templateId,
        category,
        user_id: user.id,
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Create review error:", reviewError);
      return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }

    // 创建章节
    if (sections && sections.length > 0) {
      const { error: sectionsError } = await supabase
        .from("review_sections")
        .insert(
          sections.map((s) => ({
            review_id: review.id,
            section_title: s.sectionTitle,
            content: s.content,
            order: s.order,
          }))
        );

      if (sectionsError) {
        console.error("Create sections error:", sectionsError);
        // 回滚：删除已创建的复盘记录
        await supabase.from("reviews").delete().eq("id", review.id);
        return NextResponse.json({ error: "创建章节失败" }, { status: 500 });
      }
    }

    // 获取完整的复盘记录（包含章节）
    const { data: fullReview, error: fetchError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("id", review.id)
      .single();

    if (fetchError) {
      console.error("Fetch review error:", fetchError);
      return NextResponse.json(review, { status: 201 });
    }

    return NextResponse.json(fullReview, { status: 201 });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
