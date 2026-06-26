<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  placeholder?: string
  type?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :type="type || 'text'"
    class="w-full font-ui text-sm border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--focus-blue)] placeholder:font-ui"
    :style="{
      backgroundColor: 'var(--pure-white)',
      borderColor: 'var(--border-warm)',
      borderRadius: '12px',
      padding: '8px 12px',
      color: 'var(--near-black)',
    }"
    @input="onInput"
    v-bind="$attrs"
  />
</template>
