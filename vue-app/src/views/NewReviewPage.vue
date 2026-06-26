<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Textarea from '@/components/ui/Textarea.vue'
import { createReview } from '@/db'

const router = useRouter()

const defaultSections = [
  { sectionTitle: '做了什么', content: '', order: 0 },
  { sectionTitle: '做得好的', content: '', order: 1 },
  { sectionTitle: '需改进的', content: '', order: 2 },
  { sectionTitle: '下一步', content: '', order: 3 },
]

const title = ref('')
const sections = ref([...defaultSections.map((s) => ({ ...s }))])
const saving = ref(false)

async function handleSave() {
  if (!title.value.trim()) return
  saving.value = true
  try {
    const review = await createReview({ title: title.value.trim(), category: 'custom', sections: sections.value })
    router.push(`/reviews/${review.id}`)
  } catch (err) { console.error('创建失败:', err) }
  saving.value = false
}

function updateSection(i: number, content: string) {
  sections.value[i] = { ...sections.value[i], content }
}

function addSection() {
  sections.value.push({ sectionTitle: `区块 ${sections.value.length + 1}`, content: '', order: sections.value.length })
}

function removeSection(i: number) {
  if (sections.value.length <= 1) return
  sections.value = sections.value.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, order: idx }))
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="font-serif mb-5 md:mb-8" style="font-size:24px;font-weight:500;color:var(--near-black);line-height:1.2">新建复盘</h1>

    <div class="mb-6 md:mb-8">
      <label class="block font-ui text-xs md:text-sm mb-1.5" style="color:var(--charcoal-warm);font-weight:500">标题</label>
      <Input v-model="title" placeholder="输入复盘标题，例如：每周工作复盘 - 第 22 周" />
    </div>

    <div v-for="(section, i) in sections" :key="i" class="mb-6">
      <div class="flex items-center justify-between mb-1">
        <input :value="section.sectionTitle" class="font-serif text-sm md:text-base bg-transparent outline-none border-b border-transparent transition-colors" style="color:var(--near-black);font-weight:500"
          @input="(e: Event) => { sections[i] = { ...sections[i], sectionTitle: (e.target as HTMLInputElement).value } }" />
        <button v-if="sections.length > 1" class="font-ui text-xs" style="color:var(--stone-gray)" @click="removeSection(i)">移除</button>
      </div>
      <Textarea :modelValue="section.content" :placeholder="`填写${section.sectionTitle}...`" :rows="3" @update:modelValue="(v: string) => updateSection(i, v)" />
    </div>

    <button class="font-ui text-sm mb-6 md:mb-8 transition-colors" style="color:var(--terracotta)" @click="addSection">+ 添加区块</button>

    <div class="flex gap-3 pt-2">
      <Button :disabled="saving || !title.trim()" @click="handleSave">{{ saving ? '保存中...' : '保存复盘' }}</Button>
      <Button variant="ghost" @click="router.back()">取消</Button>
    </div>
  </div>
</template>
