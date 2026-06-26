<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '@/stores/theme'
import Sidebar from '@/components/layout/Sidebar.vue'
import KeyboardShortcuts from '@/components/layout/KeyboardShortcuts.vue'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.init()
})
</script>

<template>
  <KeyboardShortcuts>
    <div class="flex min-h-screen">
      <Sidebar />
      <main class="flex-1 px-4 md:px-10 py-5 md:py-8 overflow-auto pb-20 md:pb-8">
        <router-view />
      </main>
    </div>
  </KeyboardShortcuts>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  background-color: var(--parchment);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
