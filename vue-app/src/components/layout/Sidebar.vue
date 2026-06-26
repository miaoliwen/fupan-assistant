<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/theme'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

const navItems = [
  { href: '/', label: '首页', icon: '◈' },
  { href: '/reviews', label: '复盘', icon: '◇' },
  { href: '/stats', label: '统计', icon: '◎' },
  { href: '/insights', label: '洞察', icon: '◆' },
  { href: '/graph', label: '图谱', icon: '◇' },
  { href: '/actions', label: '行动', icon: '▷' },
]

function isActive(href: string): boolean {
  if (href === '/') return route.path === '/'
  return route.path.startsWith(href)
}

function navigate(href: string) {
  router.push(href)
}
</script>

<template>
  <!-- Desktop sidebar -->
  <aside
    class="hidden md:flex w-56 flex-col min-h-screen border-r font-ui shrink-0"
    :style="{
      backgroundColor: 'var(--deep-dark)',
      borderColor: 'var(--border-dark)',
    }"
  >
    <div class="px-5 py-5" style="border-bottom: 1px solid var(--border-dark)">
      <h1
        class="text-base font-serif tracking-tight"
        style="color: var(--ivory); font-weight: 500"
      >
        复盘助手
      </h1>
      <p class="text-[10px] mt-0.5" style="color: var(--warm-silver); opacity: 0.7">
        结构化反思，持续成长
      </p>
    </div>

    <nav class="flex-1 px-2 py-3">
      <div
        v-for="item in navItems"
        :key="item.href"
        class="flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all duration-200 font-ui cursor-pointer"
        :style="{
          backgroundColor: isActive(item.href) ? 'var(--dark-surface)' : 'transparent',
          color: isActive(item.href) ? 'var(--ivory)' : 'var(--warm-silver)',
          ...(isActive(item.href) ? { boxShadow: '0px 0px 0px 1px var(--border-dark)' } : {}),
        }"
        @click="navigate(item.href)"
      >
        <span class="text-xs opacity-60">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </div>
    </nav>

    <div class="px-3 py-3 font-ui" style="border-top: 1px solid var(--border-dark)">
      <div
        class="flex items-center gap-3 px-3 py-2 rounded-lg w-full text-sm transition-all duration-200 font-ui cursor-pointer"
        style="color: var(--warm-silver); background-color: transparent"
        @click="themeStore.toggleTheme()"
      >
        <span class="text-xs opacity-60">{{ themeStore.theme === 'dark' ? '☀' : '☾' }}</span>
        <span>{{ themeStore.theme === 'dark' ? '浅色模式' : '深色模式' }}</span>
      </div>
    </div>
  </aside>

  <!-- Mobile bottom tab bar -->
  <nav
    class="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 pb-safe"
    :style="{
      backgroundColor: 'var(--deep-dark)',
      borderTop: '1px solid var(--border-dark)',
      paddingBottom: 'env(safe-area-inset-bottom, 4px)',
    }"
  >
    <div
      v-for="item in navItems"
      :key="item.href"
      class="flex flex-col items-center justify-center py-1.5 px-2 rounded-lg transition-all duration-200 cursor-pointer min-w-0"
      :style="{
        color: isActive(item.href) ? 'var(--ivory)' : 'var(--warm-silver)',
      }"
      @click="navigate(item.href)"
    >
      <span class="text-base leading-none" :style="{ opacity: isActive(item.href) ? 1 : 0.5 }">{{ item.icon }}</span>
      <span class="text-[10px] mt-0.5 font-ui whitespace-nowrap">{{ item.label }}</span>
    </div>
  </nav>
</template>
