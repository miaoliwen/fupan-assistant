<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  open: boolean
  title?: string
}>()

const emit = defineEmits<{
  close: []
}>()

watch(
  () => props.open,
  (val) => {
    if (val) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
      <div
        class="absolute inset-0"
        style="background-color: rgba(20, 20, 19, 0.5)"
        @click="emit('close')"
      />
      <div
        class="relative font-ui max-w-lg w-full mx-4 max-h-[85vh] overflow-auto"
        :style="{
          backgroundColor: 'var(--pure-white)',
          borderRadius: '16px',
          boxShadow: '0px 0px 0px 1px var(--border-warm), rgba(0,0,0,0.05) 0px 4px 24px',
        }"
      >
        <div
          v-if="title"
          class="px-6 py-4"
          style="border-bottom: 1px solid var(--border-cream)"
        >
          <h2
            class="text-lg font-serif"
            style="color: var(--near-black); font-weight: 500"
          >
            {{ title }}
          </h2>
        </div>
        <div class="p-6">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
