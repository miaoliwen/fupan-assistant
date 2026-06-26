import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 登出路由
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // 获取当前请求的 origin，确保重定向到正确的登录页
  const url = new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  return NextResponse.redirect(url.toString());
}
