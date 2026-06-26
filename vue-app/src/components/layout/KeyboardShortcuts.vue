<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const emit = defineEmits<{
  shortcutExport: []
  shortcutSave: []
}>()

onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey
    if (!mod) return

    switch (e.key.toLowerCase()) {
      case 'n':
        e.preventDefault()
        router.push('/reviews/new')
        break
      case 'e':
        if (route.path.match(/^\/reviews\/[\w-]+$/)) {
          e.preventDefault()
          emit('shortcutExport')
        }
        break
      case 's':
        if (route.path.match(/^\/reviews\/[\w-]+$/)) {
          e.preventDefault()
          emit('shortcutSave')
        }
        break
    }
  }

  window.addEventListener('keydown', handler)
  watch(
    () => route.path,
    () => {}
  )
})
</script>

<template>
  <slot />
</template>
