<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import Button from '@/components/ui/Button.vue'
import Textarea from '@/components/ui/Textarea.vue'
import Badge from '@/components/ui/Badge.vue'
import Modal from '@/components/ui/Modal.vue'
import ActionItemList from '@/components/review/ActionItemList.vue'
import AIChatPanel from '@/components/review/AIChatPanel.vue'
import { getReviewById, updateReview, deleteReview } from '@/db'
import { formatDate, exportToMarkdown } from '@/utils'
import type { Review } from '@/types'

const route = useRoute()
const router = useRouter()
const review = ref<Review | null>(null)
const editing = ref(false)
const title = ref('')
const sections = ref<Review['sections']>([])
const saving = ref(false)
const showDelete = ref(false)

const categoryLabels: Record<string, string> = { work: '工作', project: '项目', personal: '个人', custom: '自定义' }

async function fetchReview() {
  const id = route.params.id as string
  const r = await getReviewById(id)
  if (!r) { router.push('/reviews'); return }
  review.value = r; title.value = r.title; sections.value = JSON.parse(JSON.stringify(r.sections))
}

onMounted(fetchReview)

async function handleSave() {
  if (!review.value) return; saving.value = true
  await updateReview(route.params.id as string, { title: title.value, sections: sections.value.map(s => ({ id: s.id, sectionTitle: s.sectionTitle, content: s.content, order: s.order })) })
  editing.value = false; saving.value = false; fetchReview()
}

function handleExport() { if (review.value) exportToMarkdown(review.value) }
async function handleDelete() { await deleteReview(route.params.id as string); router.push('/reviews') }
function renderMarkdown(text: string): string { return marked(text, { async: false }) as string }
</script>

<template>
  <div class="max-w-2xl" v-if="review">
    <!-- Title area: stack on mobile -->
    <div class="flex flex-col sm:flex-row sm:items-start justify-between mb-5 md:mb-8 gap-3">
      <div class="min-w-0 flex-1">
        <input v-if="editing" v-model="title" class="font-serif w-full pb-1 outline-none"
          style="font-size:22px;font-weight:500;color:var(--near-black);background:transparent;border-bottom:2px solid var(--focus-blue)" />
        <h1 v-else class="font-serif" style="font-size:22px;font-weight:500;color:var(--near-black);line-height:1.2">{{ review.title }}</h1>
        <div class="flex flex-wrap items-center gap-2 mt-1.5">
          <span class="font-ui text-xs" style="color:var(--stone-gray)">{{ formatDate(review.date) }}</span>
          <Badge>{{ categoryLabels[review.category] || review.category }}</Badge>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <template v-if="editing">
          <Button size="sm" :disabled="saving" @click="handleSave">{{ saving ? '保存中...' : '保存' }}</Button>
          <Button size="sm" variant="ghost" @click="() => { editing=false; title=review!.title; sections=JSON.parse(JSON.stringify(review!.sections)) }">取消</Button>
        </template>
        <template v-else>
          <Button size="sm" variant="secondary" @click="editing=true">编辑</Button>
          <Button size="sm" variant="secondary" @click="handleExport">导出</Button>
          <Button size="sm" variant="danger" @click="showDelete=true">删除</Button>
        </template>
      </div>
    </div>

    <!-- Section content -->
    <div class="p-4 md:p-6 mb-5 md:mb-6" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <div v-if="editing">
        <div v-for="(section, i) in sections" :key="section.id || i" class="mb-5 last:mb-0">
          <label class="block font-serif text-sm md:text-base mb-1.5" style="color:var(--near-black);font-weight:500">{{ section.sectionTitle }}</label>
          <Textarea :modelValue="section.content" :rows="3" @update:modelValue="(v:string) => { sections[i] = { ...sections[i], content: v } }" />
        </div>
      </div>
      <div v-else>
        <div v-for="section in review.sections" :key="section.id" class="mb-5 last:mb-0">
          <h3 class="font-serif text-sm md:text-base mb-1.5" style="color:var(--near-black);font-weight:500">{{ section.sectionTitle }}</h3>
          <div v-if="section.content" class="markdown-content font-ui text-xs md:text-sm" style="color:var(--olive-gray)"><div v-html="renderMarkdown(section.content)" /></div>
          <p v-else class="font-ui text-xs italic" style="color:var(--stone-gray)">未填写</p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="p-4 md:p-6" style="background-color:var(--ivory);border-radius:12px;border:1px solid var(--border-cream)">
      <ActionItemList :reviewId="review.id" :actions="review.actions" @change="fetchReview" />
      <div class="mt-3 pt-3" style="border-top:1px solid var(--border-cream)">
        <Button size="sm" variant="ghost" @click="()=>{}">AI 智能提取行动项</Button>
      </div>
    </div>

    <Modal :open="showDelete" title="确认删除" @close="showDelete=false">
      <p class="font-ui text-sm mb-6" style="color:var(--olive-gray);line-height:1.6">确定要删除这条复盘记录吗？</p>
      <div class="flex gap-2 justify-end">
        <Button variant="ghost" @click="showDelete=false">取消</Button>
        <Button variant="danger" @click="handleDelete">确认删除</Button>
      </div>
    </Modal>
    <AIChatPanel :reviewId="review.id" />
  </div>
</template>
