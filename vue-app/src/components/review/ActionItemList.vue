<script setup lang="ts">
import { ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import { createAction, updateAction, deleteAction } from '@/db'
import { formatDateTime } from '@/utils'
import type { ActionItem } from '@/types'

const props = defineProps<{
  reviewId: string
  actions: ActionItem[]
}>()

const emit = defineEmits<{
  change: []
}>()

const newContent = ref('')
const newDueDate = ref('')
const adding = ref(false)

const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  pending: { label: '待完成', variant: 'warning' },
  done: { label: '已完成', variant: 'success' },
  deferred: { label: '已推迟', variant: 'default' },
}

async function handleAdd() {
  if (!newContent.value.trim()) return
  await createAction({
    reviewId: props.reviewId,
    content: newContent.value,
    dueDate: newDueDate.value || null,
  })
  newContent.value = ''
  newDueDate.value = ''
  adding.value = false
  emit('change')
}

async function handleToggle(action: ActionItem) {
  await updateAction(action.id, {
    status: action.status === 'done' ? 'pending' : 'done',
  })
  emit('change')
}

async function handleDelete(actionId: string) {
  await deleteAction(actionId)
  emit('change')
}
</script>

<template>
  <div>
    <h3
      class="text-sm font-serif mb-4"
      style="color: var(--near-black); font-weight: 500"
    >
      行动项
    </h3>

    <div class="space-y-2.5 mb-4">
      <div
        v-for="action in actions"
        :key="action.id"
        class="flex items-start gap-3 p-3.5 font-ui"
        :style="{
          backgroundColor: 'var(--ivory)',
          borderRadius: '8px',
          border: '1px solid var(--border-cream)',
        }"
      >
        <input
          type="checkbox"
          :checked="action.status === 'done'"
          class="mt-0.5 rounded"
          style="accent-color: var(--terracotta)"
          @change="handleToggle(action)"
        />
        <div class="flex-1 min-w-0">
          <p
            class="text-sm"
            :style="{
              color: action.status === 'done' ? 'var(--stone-gray)' : 'var(--near-black)',
              textDecoration: action.status === 'done' ? 'line-through' : 'none',
            }"
          >
            {{ action.content }}
          </p>
          <div class="flex items-center gap-2 mt-1.5">
            <Badge :variant="statusLabels[action.status]?.variant || 'warning'">
              {{ statusLabels[action.status]?.label || '待完成' }}
            </Badge>
            <span v-if="action.dueDate" class="text-xs" style="color: var(--stone-gray)">
              截止: {{ formatDateTime(action.dueDate) }}
            </span>
          </div>
        </div>
        <button
          class="text-sm font-ui transition-colors"
          style="color: var(--stone-gray)"
          @click="handleDelete(action.id)"
          @mouseenter="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.color = 'var(--error)' }"
          @mouseleave="(e: MouseEvent) => { (e.currentTarget as HTMLElement).style.color = 'var(--stone-gray)' }"
        >
          删除
        </button>
      </div>
    </div>

    <div v-if="adding">
      <div class="flex gap-2 mb-2">
        <Input
          v-model="newContent"
          placeholder="输入行动项内容..."
          @keydown.enter="handleAdd"
        />
        <input
          v-model="newDueDate"
          type="date"
          class="font-ui text-sm px-3 py-2 rounded-lg outline-none"
          :style="{
            backgroundColor: 'var(--warm-sand)',
            border: '1px solid var(--border-cream)',
            color: 'var(--olive-gray)',
          }"
        />
      </div>
      <div class="flex gap-2">
        <Button size="sm" @click="handleAdd">添加</Button>
        <Button
          size="sm"
          variant="ghost"
          @click="() => {
            adding = false
            newContent = ''
            newDueDate = ''
          }"
        >
          取消
        </Button>
      </div>
    </div>
    <Button v-else variant="ghost" size="sm" @click="adding = true">
      + 添加行动项
    </Button>
  </div>
</template>
