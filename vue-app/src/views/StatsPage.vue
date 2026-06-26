<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { getStats } from '@/db'
import type { Stats } from '@/types'

const router = useRouter()
const stats = ref<Stats | null>(null)
const categoryLabels: Record<string, string> = { work: '工作', project: '项目', personal: '个人', custom: '自定义' }

onMounted(async () => { stats.value = await getStats() })
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="font-serif mb-5 md:mb-8" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">统计概览</h1>

    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
      <div v-for="item in [
        { label: '总复盘数', value: stats.totalReviews, color: 'var(--near-black)' },
        { label: '连续复盘', value: stats.streak + ' 天', color: 'var(--terracotta)' },
        { label: '行动完成率', value: stats.completionRate + '%', color: stats.completionRate >= 70 ? 'var(--terracotta)' : 'var(--near-black)' },
        { label: '待办行动', value: stats.pendingActions, color: 'var(--near-black)' },
      ]" :key="item.label" class="p-4 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
        <p class="text-xs mb-1" style="color:var(--stone-gray)">{{ item.label }}</p>
        <p class="font-serif" style="font-size:24px;font-weight:500;color:item.color">{{ item.value }}</p>
      </div>
    </div>

    <div v-if="stats" class="p-4 md:p-6 mb-5 md:mb-6 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h2 class="font-serif mb-3" style="font-size:16px;font-weight:500;color:var(--near-black)">分类分布</h2>
      <div class="flex gap-3 flex-wrap">
        <div v-for="[cat, count] in Object.entries(stats.categoryStats)" :key="cat" class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: cat === 'work' ? 'var(--terracotta)' : cat === 'project' ? '#8b7355' : cat === 'personal' ? '#6b8e6b' : 'var(--stone-gray)' }" />
          <span class="text-xs" style="color:var(--olive-gray)">{{ categoryLabels[cat] || cat }}: {{ count }}</span>
        </div>
      </div>
      <div v-if="stats.totalReviews > 0" class="mt-3 flex gap-1 rounded-lg overflow-hidden">
        <div v-for="[cat, count] in Object.entries(stats.categoryStats)" :key="cat" class="h-2"
          :style="{ width: Math.round((count / stats.totalReviews) * 100) + '%', backgroundColor: cat === 'work' ? 'var(--terracotta)' : cat === 'project' ? '#8b7355' : cat === 'personal' ? '#6b8e6b' : 'var(--stone-gray)' }" />
      </div>
    </div>

    <div v-if="stats" class="p-4 md:p-6 mb-5 md:mb-6 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h2 class="font-serif mb-3" style="font-size:16px;font-weight:500;color:var(--near-black)">月度趋势</h2>
      <div class="space-y-1.5">
        <div v-for="m in stats.monthlyData" :key="m.month" class="flex items-center gap-2">
          <span class="text-xs font-ui" style="color:var(--stone-gray);width:50px;flex-shrink:0">{{ m.month.slice(5) }}</span>
          <div class="flex-1 h-5 rounded" style="background-color:var(--warm-sand);overflow:hidden">
            <div class="h-full rounded" :style="{ width: Math.min(100, (m.count / Math.max(...stats.monthlyData.map(x => x.count), 1)) * 100) + '%', backgroundColor: 'var(--terracotta)' }" />
          </div>
          <span class="text-xs font-ui" style="color:var(--olive-gray);width:20px;text-align:right">{{ m.count }}</span>
        </div>
      </div>
    </div>

    <div class="flex gap-3">
      <Button @click="router.push('/reviews/new')">新建复盘</Button>
      <Button variant="secondary" @click="router.push('/reviews')">全部复盘</Button>
    </div>
  </div>
</template>
