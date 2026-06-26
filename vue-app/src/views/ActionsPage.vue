<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Badge from '@/components/ui/Badge.vue'
import { getAllActions, updateAction } from '@/db'
import { formatDate } from '@/utils'

const router = useRouter()
const data = ref<{ pending: any[]; overdue: any[]; dueSoon: any[]; stats: { total: number; overdue: number; dueSoon: number } } | null>(null)
const filter = ref<'all' | 'overdue' | 'dueSoon'>('all')

async function fetchActions() { data.value = await getAllActions() }
onMounted(fetchActions)

async function handleComplete(actionId: string) { await updateAction(actionId, { status: 'done' }); fetchActions() }

function isOverdue(action: any) { return action.dueDate && new Date(action.dueDate) < new Date() }

const displayedActions = computed(() => {
  if (!data.value) return []
  if (filter.value === 'overdue') return data.value.overdue
  if (filter.value === 'dueSoon') return data.value.dueSoon
  return data.value.pending
})
</script>

<template>
  <div class="max-w-2xl">
    <div class="mb-5 md:mb-8">
      <h1 class="font-serif mb-1" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">行动追踪</h1>
      <p class="font-ui text-xs md:text-sm" style="color:var(--stone-gray)">从复盘中提取的下一步行动</p>
    </div>

    <div v-if="data" class="grid grid-cols-3 gap-2 md:gap-4 mb-5 md:mb-8">
      <div class="p-3 md:p-4 font-ui text-left transition-all cursor-pointer"
        :style="{ backgroundColor: 'var(--ivory)', borderRadius: '10px', border: filter === 'all' ? '2px solid var(--terracotta)' : '1px solid var(--border-cream)' }"
        @click="filter = 'all'">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">待办</p>
        <p class="font-serif" style="font-size:22px;font-weight:500;color:var(--near-black)">{{ data.stats.total }}</p>
      </div>
      <div class="p-3 md:p-4 font-ui text-left transition-all cursor-pointer"
        :style="{ backgroundColor: 'var(--ivory)', borderRadius: '10px', border: filter === 'overdue' ? '2px solid var(--error)' : '1px solid var(--border-cream)' }"
        @click="filter = 'overdue'">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">逾期</p>
        <p class="font-serif" style="font-size:22px;font-weight:500;color:var(--error)">{{ data.stats.overdue }}</p>
      </div>
      <div class="p-3 md:p-4 font-ui text-left transition-all cursor-pointer"
        :style="{ backgroundColor: 'var(--ivory)', borderRadius: '10px', border: filter === 'dueSoon' ? '2px solid var(--terracotta)' : '1px solid var(--border-cream)' }"
        @click="filter = 'dueSoon'">
        <p class="text-xs mb-0.5" style="color:var(--stone-gray)">即将到期</p>
        <p class="font-serif" style="font-size:22px;font-weight:500;color:var(--terracotta)">{{ data.stats.dueSoon }}</p>
      </div>
    </div>

    <div v-if="displayedActions.length === 0" class="p-8 md:p-10 text-center font-ui" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <p style="color:var(--stone-gray)">暂无待办行动项</p>
    </div>
    <div v-else class="space-y-2">
      <div v-for="action in displayedActions" :key="action.id" class="p-3 md:p-4 font-ui flex items-start gap-3"
        :style="{ backgroundColor: 'var(--ivory)', borderRadius: '8px', border: isOverdue(action) ? '1px solid rgba(181,51,51,0.3)' : '1px solid var(--border-cream)' }">
        <div class="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 cursor-pointer" style="border-color:var(--terracotta)" @click="handleComplete(action.id)" />
        <div class="flex-1 min-w-0">
          <p class="text-sm" style="color:var(--near-black)">{{ action.content }}</p>
          <div class="flex items-center gap-2 mt-1.5 flex-wrap">
            <span class="text-xs" style="color:var(--stone-gray)">{{ action.review?.title || '' }}</span>
            <span v-if="action.dueDate" class="text-xs" :style="{ color: isOverdue(action) ? 'var(--error)' : 'var(--stone-gray)' }">{{ formatDate(action.dueDate) }}</span>
            <Badge v-if="isOverdue(action)" variant="danger">逾期</Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
