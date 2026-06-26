import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; actionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id, actionId } = await params;

    // 获取当前用户
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 });
    }

    // 验证复盘记录属于当前用户
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    // 验证行动项属于此复盘记录
    const { data: existingAction, error: existingError } = await supabase
      .from("action_items")
      .select("id")
      .eq("id", actionId)
      .eq("review_id", id)
      .single();

    if (existingError || !existingAction) {
      return NextResponse.json({ error: "行动项未找到" }, { status: 404 });
    }

    // 删除行动项
    const { error: deleteError } = await supabase
      .from("action_items")
      .delete()
      .eq("id", actionId);

    if (deleteError) {
      console.error("Delete action error:", deleteError);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /api/reviews/[id]/actions/[actionId] error:",
      error
    );
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
