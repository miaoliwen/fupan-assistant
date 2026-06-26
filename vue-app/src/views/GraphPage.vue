<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import { getGraphData } from '@/db'
import type { GraphNode, GraphEdge } from '@/types'

const router = useRouter()
const data = ref<{ nodes: GraphNode[]; edges: GraphEdge[]; stats: any } | null>(null)

onMounted(async () => { data.value = await getGraphData() })
</script>

<template>
  <div class="max-w-4xl">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-5 md:mb-6 gap-3">
      <div>
        <h1 class="font-serif" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">知识图谱</h1>
        <p class="font-ui text-xs md:text-sm mt-1" style="color:var(--stone-gray)">关键词与复盘的关联网络</p>
      </div>
      <Button variant="secondary" size="sm" @click="router.push('/insights')">洞察报告</Button>
    </div>

    <div class="mb-5 font-ui text-xs md:text-sm flex gap-3 flex-wrap" style="color:var(--olive-gray)" v-if="data">
      <span><span class="inline-block w-2.5 h-2.5 rounded-full align-middle" style="background-color:var(--terracotta);margin-right:3px" />关键词</span>
      <span><span class="inline-block w-2.5 h-2.5 rounded-full align-middle" style="background-color:var(--stone-gray);margin-right:3px" />复盘</span>
      <span style="color:var(--stone-gray)">{{ data.nodes.length }} 节点 · {{ data.edges.length }} 连接</span>
    </div>

    <div v-if="data" class="p-5 md:p-6 mb-5 md:mb-6" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h3 class="font-serif mb-4" style="font-size:15px;font-weight:500;color:var(--near-black)">关键词图谱</h3>
      <div class="space-y-4">
        <div v-for="kw in data.stats.topKeywords.slice(0, 15)" :key="kw.word">
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-block w-2 h-2 rounded-full" style="background-color:var(--terracotta)" />
            <span class="font-ui text-sm" style="color:var(--near-black);font-weight:500">{{ kw.word }}</span>
            <span class="font-ui text-xs" style="color:var(--stone-gray)">({{ kw.count }} 次)</span>
          </div>
          <div class="flex flex-wrap gap-1 ml-3">
            <span v-for="edge in data.edges.filter(e => e.source === 'kw-' + kw.word || e.target === 'kw-' + kw.word).slice(0, 8)" :key="edge.source + '-' + edge.target" class="px-2 py-0.5 text-xs rounded"
              style="background-color:var(--warm-sand);color:var(--olive-gray);font-size:11px">
              {{ (edge.source.startsWith('kw-') ? edge.source.replace('kw-', '') : edge.target.replace('kw-', '')).slice(0, 8) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="data" class="p-5" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <h3 class="font-serif mb-3" style="font-size:15px;font-weight:500;color:var(--near-black)">核心关键词 Top 10</h3>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="kw in data.stats.topKeywords" :key="kw.word" class="px-2.5 py-1 rounded-full text-xs"
          :style="{ backgroundColor: kw.count >= 5 ? 'var(--terracotta)' : 'var(--warm-sand)', color: kw.count >= 5 ? 'var(--ivory)' : 'var(--charcoal-warm)' }">
          {{ kw.word }} ({{ kw.count }})
        </span>
      </div>
    </div>
  </div>
</template>
