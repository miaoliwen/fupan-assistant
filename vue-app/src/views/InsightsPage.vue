<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { getInsights } from '@/db'
import type { InsightData, AISummary } from '@/types'

const router = useRouter()
const data = ref<InsightData | null>(null)
const period = ref<'week' | 'month' | 'quarter'>('month')
const aiSummary = ref<AISummary | null>(null)
const aiLoading = ref(false)
const categoryLabels: Record<string, string> = { work: '工作', project: '项目', personal: '个人', custom: '自定义' }

async function fetchData() { data.value = await getInsights(period.value); aiSummary.value = null }
onMounted(fetchData)

async function generateAISummary() {
  aiLoading.value = true
  try {
    const res = await fetch('/api/ai/insight-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period: period.value }),
    })
    aiSummary.value = await res.json()
  } catch {
    aiSummary.value = { summary: '生成失败，请稍后再试', highlights: [], patterns: [], suggestions: [] }
  }
  aiLoading.value = false
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-8 gap-3">
      <h1 class="font-serif" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">周期性洞察</h1>
      <div class="flex gap-2 font-ui">
        <button v-for="p in ['week','month','quarter']" :key="p" class="px-2.5 py-1.5 text-xs md:text-sm rounded-lg transition-all cursor-pointer"
          :style="{ backgroundColor: period === p ? 'var(--terracotta)' : 'var(--warm-sand)', color: period === p ? 'var(--ivory)' : 'var(--charcoal-warm)' }"
          @click="period = p as any; fetchData()">
          {{ { week: '本周', month: '本月', quarter: '本季' }[p as keyof typeof data] }}
        </button>
      </div>
    </div>

    <div v-if="data" class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5 md:mb-8">
      <div class="p-4 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">复盘数</p>
        <p class="font-serif" style="font-size:24px;font-weight:500;color:var(--near-black)">{{ data.summary.currentCount }}</p>
        <p class="text-xs mt-0.5" :style="{ color: data.summary.changePercent >= 0 ? 'var(--terracotta)' : 'var(--stone-gray)' }">
          {{ data.summary.changePercent >= 0 ? '+' : '' }}{{ data.summary.changePercent }}%
        </p>
      </div>
      <div class="p-4 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">连续复盘</p>
        <p class="font-serif" style="font-size:24px;font-weight:500;color:var(--terracotta)">{{ data.summary.streak }}<span class="text-xs text-[var(--stone-gray)] font-ui"> 天</span></p>
      </div>
      <div class="p-4 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">行动完成率</p>
        <p class="font-serif" style="font-size:24px;font-weight:500;color:var(--near-black)">{{ data.summary.actionCompletionRate }}%</p>
      </div>
      <div class="p-4 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">高频主题</p>
        <p class="font-serif" style="font-size:24px;font-weight:500;color:var(--near-black)">{{ data.recurringThemes.length }}</p>
      </div>
    </div>

    <div class="p-5 md:p-6 mb-5 md:mb-6 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <div class="flex items-center justify-between mb-4 gap-2">
        <h2 class="font-serif" style="font-size:16px;font-weight:500;color:var(--near-black)">AI 深度分析</h2>
        <Button size="sm" variant="secondary" :disabled="aiLoading" @click="generateAISummary">
          {{ aiLoading ? '分析中...' : aiSummary ? '重新分析' : '生成 AI 分析' }}
        </Button>
      </div>
      <div v-if="aiSummary" class="space-y-3">
        <p class="text-sm" style="color:var(--olive-gray);line-height:1.7">{{ aiSummary.summary }}</p>
        <div v-if="aiSummary.highlights.length"><p class="text-xs mb-1.5" style="color:var(--terracotta)">亮点</p>
          <div class="flex flex-wrap gap-1.5"><span v-for="h in aiSummary.highlights" :key="h" class="px-2.5 py-1 rounded-full text-xs" style="background-color:rgba(201,100,66,0.1);color:var(--terracotta)">{{ h }}</span></div></div>
        <div v-if="aiSummary.patterns.length"><p class="text-xs mb-1.5" style="color:var(--olive-gray)">模式</p>
          <ul class="space-y-1"><li v-for="p in aiSummary.patterns" :key="p" class="text-sm" style="color:var(--olive-gray)">· {{ p }}</li></ul></div>
        <div v-if="aiSummary.suggestions.length"><p class="text-xs mb-1.5" style="color:var(--near-black)">建议</p>
          <ul class="space-y-1"><li v-for="(s,i) in aiSummary.suggestions" :key="i" class="text-sm" style="color:var(--near-black)">{{ i+1 }}. {{ s }}</li></ul></div>
      </div>
      <p v-else class="text-sm" style="color:var(--stone-gray);line-height:1.6">点击生成 AI 分析</p>
    </div>

    <div v-if="data && data.recurringThemes.length" class="p-5 md:p-6 mb-5 md:mb-6 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h2 class="font-serif mb-3" style="font-size:16px;font-weight:500;color:var(--near-black)">反复出现的主题</h2>
      <div class="flex flex-wrap gap-1.5">
        <div v-for="t in data.recurringThemes" :key="t.keyword" class="px-2.5 py-1 rounded-full text-xs"
          :style="{ backgroundColor: t.reviewCount >= 4 ? 'var(--terracotta)' : t.reviewCount >= 3 ? '#d4b89a' : 'var(--warm-sand)', color: t.reviewCount >= 4 ? 'var(--ivory)' : 'var(--charcoal-warm)' }">
          {{ t.keyword }} {{ t.reviewCount }}篇
        </div>
      </div>
    </div>

    <div v-if="data && data.topKeywords.length" class="p-5 md:p-6 mb-5 md:mb-6 font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h2 class="font-serif mb-3" style="font-size:16px;font-weight:500;color:var(--near-black)">高频关键词</h2>
      <div class="space-y-1.5">
        <div v-for="kw in data.topKeywords.slice(0,12)" :key="kw.word" class="flex items-center gap-2">
          <span class="text-xs font-ui" style="color:var(--olive-gray);width:60px;flex-shrink:0;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ kw.word }}</span>
          <div class="flex-1 h-4 rounded" style="background-color:var(--warm-sand);overflow:hidden">
            <div class="h-full rounded" style="background-color:var(--terracotta)"
              :style="{ width: Math.min(100, (kw.count / Math.max(...data.topKeywords.slice(0,12).map(x=>x.count),1))*100) + '%' }" />
          </div>
          <span class="text-xs" style="color:var(--stone-gray);width:20px;text-align:right">{{ kw.count }}</span>
        </div>
      </div>
    </div>

    <div class="flex gap-3">
      <Button variant="secondary" @click="router.push('/graph')">知识图谱</Button>
      <Button variant="secondary" @click="router.push('/actions')">行动项</Button>
    </div>
  </div>
</template>
