import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * 登出路由
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(".supabase.co", "") || ""}/login`);
}
