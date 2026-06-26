"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 认证守卫 Hook
 * 检查用户是否登录，未登录则跳转到登录页
 */
export function useAuthGuard() {
  const { user, loading, loadUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  return { user, loading };
}
