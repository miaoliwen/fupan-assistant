<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
})

const variantStyles: Record<string, Record<string, string>> = {
  primary: {
    backgroundColor: 'var(--terracotta)',
    color: 'var(--ivory)',
    borderRadius: '8px',
    boxShadow: '0px 0px 0px 1px var(--terracotta)',
  },
  secondary: {
    backgroundColor: 'var(--warm-sand)',
    color: 'var(--charcoal-warm)',
    borderRadius: '8px',
    boxShadow: '0px 0px 0px 1px var(--warm-sand), 0px 0px 0px 2px var(--ring-warm)',
  },
  danger: {
    backgroundColor: 'var(--error)',
    color: 'var(--ivory)',
    borderRadius: '8px',
    boxShadow: '0px 0px 0px 1px var(--error)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--olive-gray)',
    borderRadius: '8px',
  },
}

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

function handleMouseEnter(e: MouseEvent) {
  if (props.disabled) return
  const el = e.currentTarget as HTMLElement
  if (props.variant === 'primary') el.style.backgroundColor = 'var(--terracotta-hover)'
  else if (props.variant === 'secondary') el.style.backgroundColor = 'var(--border-warm)'
  else if (props.variant === 'ghost') el.style.backgroundColor = 'var(--border-cream)'
}

function handleMouseLeave(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement
  if (props.variant === 'primary') el.style.backgroundColor = 'var(--terracotta)'
  else if (props.variant === 'secondary') el.style.backgroundColor = 'var(--warm-sand)'
  else if (props.variant === 'ghost') el.style.backgroundColor = 'transparent'
}
</script>

<template>
  <button
    :disabled="disabled"
    :class="['inline-flex items-center justify-center font-ui font-medium transition-all duration-200 focus:outline-none', sizeClasses[size], { 'disabled:opacity-50 disabled:pointer-events-none': disabled }]"
    :style="variantStyles[variant]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <slot />
  </button>
</template>
