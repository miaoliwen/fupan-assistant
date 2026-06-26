<script setup lang="ts">
import { ref } from 'vue'
import { marked } from 'marked'
import Button from '@/components/ui/Button.vue'

const props = defineProps<{
  reviewId: string
}>()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const open = ref(false)
const messages = ref<Message[]>([])
const input = ref('')
const loading = ref(false)
const messagesEnd = ref<HTMLDivElement | null>(null)

const quickPrompts = [
  '帮我深入反思这篇复盘',
  '我的改进计划具体吗？',
  '这段复盘里有什么模式？',
  '帮我补充行动项的细节',
]

async function handleSend() {
  if (!input.value.trim() || loading.value) return

  const userMsg: Message = { role: 'user', content: input.value.trim() }
  messages.value.push(userMsg)
  input.value = ''
  loading.value = true

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId: props.reviewId, messages: messages.value }),
    })
    const data = await res.json()
    if (data.reply) {
      messages.value.push({ role: 'assistant', content: data.reply })
    }
  } catch {
    messages.value.push({ role: 'assistant', content: '抱歉，出了点问题，请稍后再试。' })
  }
  loading.value = false
}

function renderMarkdown(text: string): string {
  return marked(text, { async: false }) as string
}
</script>

<template>
  <div
    class="mt-6 font-ui"
    :style="{
      backgroundColor: 'var(--ivory)',
      borderRadius: '12px',
      border: '1px solid var(--border-cream)',
    }"
  >
    <div
      class="w-full p-4 flex items-center justify-between text-left cursor-pointer"
      style="user-select: none"
      @click="open = !open"
    >
      <div>
        <h3 class="font-serif" style="font-size: 16px; font-weight: 500; color: var(--near-black)">
          AI 复盘助手
        </h3>
        <p class="text-xs mt-0.5" style="color: var(--stone-gray)">
          与 AI 对话，深入反思这篇复盘内容
        </p>
      </div>
      <span class="text-sm" style="color: var(--stone-gray)">
        {{ open ? '收起' : '展开' }}
      </span>
    </div>

    <div v-if="open" class="px-4 pb-4">
      <!-- Messages -->
      <div
        class="mb-3 overflow-y-auto"
        :style="{
          maxHeight: '320px',
          borderRadius: '8px',
          backgroundColor: 'var(--warm-sand)',
          padding: messages.length > 0 ? '12px' : '0',
        }"
      >
        <div v-if="messages.length === 0" class="p-4 text-center">
          <p class="text-sm mb-3" style="color: var(--olive-gray)">
            选择一个话题开始对话
          </p>
          <div class="flex flex-wrap gap-2 justify-center">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              class="px-3 py-1.5 rounded-full text-xs transition-colors"
              :style="{
                backgroundColor: 'var(--ivory)',
                color: 'var(--olive-gray)',
                border: '1px solid var(--border-cream)',
              }"
              @click="input = prompt"
              @mouseenter="(e: MouseEvent) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'var(--terracotta)'
                el.style.color = 'var(--ivory)'
              }"
              @mouseleave="(e: MouseEvent) => {
                const el = e.currentTarget as HTMLElement
                el.style.backgroundColor = 'var(--ivory)'
                el.style.color = 'var(--olive-gray)'
              }"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['mb-3 last:mb-0', msg.role === 'user' ? 'text-right' : 'text-left']"
        >
          <div
            class="inline-block px-3 py-2 rounded-lg text-sm max-w-[85%]"
            :style="{
              backgroundColor: msg.role === 'user' ? 'var(--terracotta)' : 'var(--ivory)',
              color: msg.role === 'user' ? 'var(--ivory)' : 'var(--near-black)',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
            }"
          >
            <div v-if="msg.role === 'assistant'" class="markdown-content text-sm" v-html="renderMarkdown(msg.content)" />
            <template v-else>{{ msg.content }}</template>
          </div>
        </div>

        <div v-if="loading" class="text-left">
          <div
            class="inline-block px-3 py-2 rounded-lg text-sm"
            :style="{
              backgroundColor: 'var(--ivory)',
              color: 'var(--stone-gray)',
              borderRadius: '12px 12px 12px 2px',
            }"
          >
            思考中...
          </div>
        </div>
        <div ref="messagesEnd" />
      </div>

      <!-- Input -->
      <div class="flex gap-2">
        <input
          v-model="input"
          placeholder="输入你的问题或想法..."
          class="flex-1 font-ui text-sm px-3 py-2 rounded-lg outline-none"
          :style="{
            backgroundColor: 'var(--warm-sand)',
            border: '1px solid var(--border-cream)',
            color: 'var(--near-black)',
          }"
          @keydown.enter="handleSend"
        />
        <Button size="sm" :disabled="loading || !input.trim()" @click="handleSend">
          {{ loading ? '发送中...' : '发送' }}
        </Button>
      </div>
    </div>
  </div>
</template>
