<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'default' | 'success' | 'warning' | 'danger'
}>(), {
  variant: 'default',
})

const variantStyles: Record<string, Record<string, string>> = {
  default: {
    backgroundColor: 'var(--warm-sand)',
    color: 'var(--charcoal-warm)',
  },
  success: {
    backgroundColor: 'var(--warm-sand)',
    color: 'var(--terracotta)',
  },
  warning: {
    backgroundColor: '#f0e8d8',
    color: 'var(--charcoal-warm)',
  },
  danger: {
    backgroundColor: '#f0d8d8',
    color: 'var(--error)',
  },
}
</script>

<template>
  <span
    class="inline-flex items-center font-ui text-xs font-medium"
    :style="{
      ...variantStyles[variant],
      padding: '2px 8px',
      borderRadius: '24px',
      letterSpacing: '0.12px',
    }"
  >
    <slot />
  </span>
</template>
