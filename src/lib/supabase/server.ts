import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 创建服务端 Supabase 客户端
 * 用于 Server Components、Server Actions、API Routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components 中调用 setAll 会被忽略
            // 这是正常行为，由 middleware 处理 session 刷新
          }
        },
      },
    }
  );
}
