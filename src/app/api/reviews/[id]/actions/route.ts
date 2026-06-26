import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createActionSchema, updateActionSchema } from "@/lib/validations";

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

    // 获取行动项
    const { data: actions, error } = await supabase
      .from("action_items")
      .select("*")
      .eq("review_id", id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Get actions error:", error);
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    return NextResponse.json(actions || []);
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
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // 创建行动项
    const { data: action, error: actionError } = await supabase
      .from("action_items")
      .insert({
        review_id: id,
        content: parsed.data.content,
        due_date: parsed.data.dueDate || null,
      })
      .select()
      .single();

    if (actionError) {
      console.error("Create action error:", actionError);
      return NextResponse.json({ error: "创建失败" }, { status: 500 });
    }

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
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "复盘未找到" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dueDate, ...data } = parsed.data;

    // 从请求体中获取 actionId
    const actionId = body.id;
    if (!actionId) {
      return NextResponse.json({ error: "缺少行动项 ID" }, { status: 400 });
    }

    // 验证该 actionItem 属于此 review
    const { data: existingAction, error: existingError } = await supabase
      .from("action_items")
      .select("id")
      .eq("id", actionId)
      .eq("review_id", id)
      .single();

    if (existingError || !existingAction) {
      return NextResponse.json({ error: "行动项未找到" }, { status: 404 });
    }

    // 更新行动项
    const updateData: Record<string, unknown> = { ...data };
    if (dueDate !== undefined) {
      updateData.due_date = dueDate ? new Date(dueDate).toISOString() : null;
    }
    if (data.status === "done") {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: updatedAction, error: updateError } = await supabase
      .from("action_items")
      .update(updateData)
      .eq("id", actionId)
      .select()
      .single();

    if (updateError) {
      console.error("Update action error:", updateError);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json(updatedAction);
  } catch (error) {
    console.error("PUT /api/reviews/[id]/actions error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
