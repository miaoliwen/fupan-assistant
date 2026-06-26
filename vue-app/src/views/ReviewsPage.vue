<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Badge from '@/components/ui/Badge.vue'
import { getAllReviews } from '@/db'
import { formatDate } from '@/utils'
import type { Review } from '@/types'

const router = useRouter()
const reviews = ref<Review[]>([])
const search = ref('')
const category = ref('')
const loading = ref(true)

const categoryLabels: Record<string, string> = { work: '工作', project: '项目', personal: '个人', custom: '自定义' }

async function fetchReviews() {
  loading.value = true
  const result = await getAllReviews({ category: category.value || undefined, search: search.value || undefined, limit: 50 })
  reviews.value = result.reviews
  loading.value = false
}

onMounted(fetchReviews)
function onSearch() { fetchReviews() }
</script>

<template>
  <div class="max-w-2xl">
    <div class="flex items-center justify-between mb-5 md:mb-8">
      <h1 class="font-serif" style="font-size:24px;color:var(--near-black);font-weight:500;line-height:1.2">复盘记录</h1>
      <Button @click="router.push('/reviews/new')">新建复盘</Button>
    </div>

    <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-5 md:mb-8">
      <Input v-model="search" placeholder="搜索复盘内容..." class="flex-1" @keydown.enter="onSearch" />
      <div class="flex gap-2">
        <Button variant="secondary" class="flex-1 sm:flex-none" @click="onSearch">搜索</Button>
        <select v-model="category" class="font-ui text-sm flex-1 sm:flex-none"
          :style="{ backgroundColor:'var(--pure-white)', borderColor:'var(--border-warm)', borderRadius:'12px', padding:'8px 12px', color:'var(--near-black)', border:'1px solid var(--border-warm)' }"
          @change="fetchReviews">
          <option value="">全部分类</option>
          <option value="work">工作</option>
          <option value="project">项目</option>
          <option value="personal">个人</option>
          <option value="custom">自定义</option>
        </select>
      </div>
    </div>

    <p v-if="loading" class="text-center py-8 font-ui" style="color:var(--stone-gray)">加载中...</p>

    <div v-else-if="reviews.length === 0" class="p-10 text-center font-ui"
      :style="{ backgroundColor:'var(--ivory)', borderRadius:'12px', border:'1px solid var(--border-cream)' }">
      <p class="mb-4" style="color:var(--stone-gray)">暂无复盘记录</p>
      <Button @click="router.push('/reviews/new')">创建第一个复盘</Button>
    </div>

    <div v-else class="space-y-3">
      <div v-for="review in reviews" :key="review.id" class="block p-4 md:p-5 font-ui transition-all duration-200 cursor-pointer"
        :style="{ backgroundColor:'var(--ivory)', borderRadius:'10px', border:'1px solid var(--border-cream)' }"
        @click="router.push(`/reviews/${review.id}`)">
        <div class="flex items-start justify-between gap-2 mb-1.5">
          <div class="min-w-0 flex-1">
            <h3 class="font-serif text-sm md:text-base" style="color:var(--near-black);font-weight:500;line-height:1.3">{{ review.title }}</h3>
            <p class="text-xs mt-0.5" style="color:var(--stone-gray)">{{ formatDate(review.date) }}</p>
          </div>
          <div class="flex gap-1.5 items-center shrink-0">
            <Badge>{{ categoryLabels[review.category] || review.category }}</Badge>
            <Badge v-if="review.actions.filter(a => a.status === 'pending').length > 0" variant="warning">
              {{ review.actions.filter(a => a.status === 'pending').length }}
            </Badge>
          </div>
        </div>
        <div class="text-xs md:text-sm line-clamp-2" style="color:var(--olive-gray);line-height:1.5">
          {{ review.sections.map(s => s.content).filter(Boolean).join(' / ') }}
        </div>
      </div>
    </div>
  </div>
</template>
