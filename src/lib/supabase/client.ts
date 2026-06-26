import { createBrowserClient } from "@supabase/ssr";

/**
 * 创建客户端 Supabase 客户端
 * 用于 Client Components（需要 "use client"）
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
