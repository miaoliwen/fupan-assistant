import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateReviewSchema } from "@/lib/validations";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 获取复盘记录（包含章节和行动项）
    const { data: review, error } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    // 排序章节和行动项
    review.sections = (review.sections || []).sort(
      (a: { order: number }, b: { order: number }) => a.order - b.order
    );
    review.actions = (review.actions || []).sort(
      (a: { created_at: string }, b: { created_at: string }) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

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
    const supabase = await createClient();
    const { id } = await params;

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { sections, ...data } = parsed.data;

    // 验证复盘记录属于当前用户
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    // 更新复盘记录
    const updateData: Record<string, unknown> = {};
    if (data.title) updateData.title = data.title;
    if (data.category) updateData.category = data.category;

    const { error: updateError } = await supabase
      .from("reviews")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      console.error("Update review error:", updateError);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    // 更新章节（如果提供）
    if (sections) {
      // 删除旧章节
      await supabase.from("review_sections").delete().eq("review_id", id);

      // 创建新章节
      if (sections.length > 0) {
        const { error: sectionsError } = await supabase
          .from("review_sections")
          .insert(
            sections.map((s) => ({
              review_id: id,
              section_title: s.sectionTitle,
              content: s.content,
              order: s.order,
            }))
          );

        if (sectionsError) {
          console.error("Update sections error:", sectionsError);
          return NextResponse.json(
            { error: "更新章节失败" },
            { status: 500 }
          );
        }
      }
    }

    // 获取更新后的完整记录
    const { data: updatedReview, error: refetchError } = await supabase
      .from("reviews")
      .select(
        `
        *,
        sections:review_sections(*),
        actions:action_items(*)
      `
      )
      .eq("id", id)
      .single();

    if (refetchError) {
      console.error("Refetch review error:", refetchError);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(updatedReview);
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
    const supabase = await createClient();
    const { id } = await params;

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 验证复盘记录属于当前用户
    const { data: existingReview, error: fetchError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    // 删除复盘记录（级联删除章节和行动项）
    const { error: deleteError } = await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Delete review error:", deleteError);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/reviews/[id] error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
