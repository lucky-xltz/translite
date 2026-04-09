<script setup lang="ts">
import { Languages, Settings, Moon, Sun } from 'lucide-vue-next'

defineProps<{
  isDark: boolean
}>()

const emit = defineEmits<{
  openSettings: []
  toggleDark: []
}>()
</script>

<template>
  <header
    class="flex items-center justify-between px-6 py-4 border-b"
    :class="isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/50 border-slate-100/50'"
  >
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md">
        <Languages class="w-4 h-4 text-white" />
      </div>
      <h1 class="text-lg font-semibold tracking-wide" :class="isDark ? 'text-slate-100' : 'text-slate-700'">轻译</h1>
      <span
        class="px-2 py-0.5 rounded-md text-xs font-medium border hidden sm:inline-block"
        :class="isDark ? 'bg-slate-700/50 text-slate-300 border-slate-600' : 'bg-blue-50 text-blue-600 border-blue-100'"
      >
        智能中英互译
      </span>
    </div>

    <div class="flex items-center gap-2">
      <button
        @click="emit('toggleDark')"
        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        :class="isDark ? 'hover:text-slate-200 hover:bg-slate-700' : ''"
        title="切换主题"
      >
        <Moon v-if="!isDark" class="w-5 h-5" />
        <Sun v-else class="w-5 h-5" />
      </button>
      <button
        @click="emit('openSettings')"
        class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        :class="isDark ? 'hover:text-slate-200 hover:bg-slate-700' : ''"
        title="模型配置"
      >
        <Settings class="w-5 h-5" />
      </button>
    </div>
  </header>
</template>
