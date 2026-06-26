<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <textarea
    :value="modelValue"
    :placeholder="placeholder"
    :rows="rows || 4"
    class="w-full font-ui text-sm transition-all duration-200 border resize-y min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[var(--focus-blue)] placeholder:font-ui"
    :style="{
      backgroundColor: 'var(--pure-white)',
      borderColor: 'var(--border-warm)',
      borderRadius: '12px',
      padding: '10px 12px',
      color: 'var(--near-black)',
      lineHeight: '1.6',
    }"
    @input="onInput"
    v-bind="$attrs"
  />
</template>
