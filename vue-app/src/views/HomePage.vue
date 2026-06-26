<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { getStats, getAllReviews } from '@/db'
import { formatDate } from '@/utils'
import type { Stats, Review } from '@/types'

const router = useRouter()
const stats = ref<Stats | null>(null)
const recentReviews = ref<Review[]>([])

onMounted(async () => {
  stats.value = await getStats()
  const result = await getAllReviews({ limit: 5 })
  recentReviews.value = result.reviews
})
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-6 md:mb-10">
      <h1 class="font-serif mb-1" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">复盘助手</h1>
      <p class="font-ui text-xs md:text-sm" style="color:var(--olive-gray);line-height:1.6">
        通过结构化的复盘，发现成长规律，持续改进
      </p>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
      <div class="p-4 md:p-5 font-ui" :style="{ backgroundColor:'var(--ivory)', borderRadius:'12px', border:'1px solid var(--border-cream)' }">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">总复盘数</p>
        <p class="font-serif" style="font-size:26px;font-weight:500;color:var(--near-black)">{{ stats?.totalReviews || 0 }}</p>
      </div>
      <div class="p-4 md:p-5 font-ui" :style="{ backgroundColor:'var(--ivory)', borderRadius:'12px', border:'1px solid var(--border-cream)' }">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">待办行动项</p>
        <p class="font-serif" style="font-size:26px;font-weight:500;color:var(--terracotta)">{{ stats?.pendingActions || 0 }}</p>
      </div>
      <div class="p-4 md:p-5 flex items-center font-ui" :style="{ backgroundColor:'var(--ivory)', borderRadius:'12px', border:'1px solid var(--border-cream)' }">
        <Button class="w-full text-sm" @click="router.push('/reviews/new')">新建复盘</Button>
      </div>
    </div>

    <div v-if="recentReviews.length > 0" class="space-y-2">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-serif" style="font-size:17px;font-weight:500;color:var(--near-black)">最近复盘</h2>
        <span class="font-ui text-xs cursor-pointer" style="color:var(--terracotta)" @click="router.push('/reviews')">查看全部 →</span>
      </div>
      <div v-for="review in recentReviews" :key="review.id" class="p-3.5 md:p-4 font-ui transition-all duration-200 cursor-pointer"
        :style="{ backgroundColor:'var(--ivory)', borderRadius:'8px', border:'1px solid var(--border-cream)' }"
        @click="router.push(`/reviews/${review.id}`)">
        <div class="flex items-center justify-between">
          <div class="min-w-0 flex-1">
            <h3 class="text-sm" style="color:var(--near-black);font-weight:500">{{ review.title }}</h3>
            <p class="text-xs mt-0.5" style="color:var(--stone-gray)">{{ formatDate(review.date) }}</p>
          </div>
          <Badge v-if="review.actions.filter(a => a.status === 'pending').length > 0" variant="warning">有待办</Badge>
        </div>
      </div>
    </div>

    <div v-else class="p-8 md:p-10 text-center font-ui mt-8"
      :style="{ backgroundColor:'var(--ivory)', borderRadius:'12px', border:'1px solid var(--border-cream)' }">
      <p class="mb-3 text-sm" style="color:var(--stone-gray)">还没有复盘记录</p>
      <Button @click="router.push('/reviews/new')">开始第一次复盘</Button>
    </div>
  </div>
</template>
