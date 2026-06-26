"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * 认证守卫 Hook
 * 检查用户是否登录，未登录则跳转到登录页
 * 使用一次性检查，避免重复加载
 */
export function useAuthGuard() {
  const { user, loading, loadUser } = useAuthStore();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 只在未加载过用户时执行加载
    if (!checked && loading) {
      loadUser().finally(() => setChecked(true));
    } else if (!loading) {
      setChecked(true);
    }
  }, [loadUser, loading, checked]);

  useEffect(() => {
    // 只在加载完成后且确认未登录时才重定向
    if (checked && !loading && !user) {
      router.replace("/login");
    }
  }, [checked, loading, user, router]);

  return { user, loading: loading || !checked };
}
