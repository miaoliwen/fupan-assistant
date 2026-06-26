import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Theme } from '@/types'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>('light')

  function init() {
    const saved = localStorage.getItem('fupan-theme') as Theme | null
    if (saved) {
      theme.value = saved
      document.documentElement.setAttribute('data-theme', saved)
    }
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem('fupan-theme', theme.value)
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return { theme, init, toggleTheme }
})
