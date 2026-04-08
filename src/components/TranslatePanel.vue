<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, Sparkles, ArrowRightLeft, Copy } from 'lucide-vue-next'

defineProps<{
  isDark: boolean
  isLoading: boolean
  isStreaming?: boolean
}>()

const emit = defineEmits<{
  translate: []
  clear: []
  copy: []
}>()

const sourceText = defineModel<string>('sourceText', { required: true })
const targetText = defineModel<string>('targetText', { required: true })

const charCount = computed(() => sourceText.value.length)

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    emit('translate')
  }
}

function clearAll() {
  sourceText.value = ''
  targetText.value = ''
  emit('clear')
}

function copyResult() {
  emit('copy')
}
</script>

<template>
  <main class="flex-1 flex flex-col md:flex-row p-4 gap-4 overflow-hidden">
    <!-- 源文本框 -->
    <div class="flex-1 flex flex-col rounded-3xl border shadow-inner-soft relative group" :class="isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50/50 border-slate-100/80'">
      <div class="flex items-center justify-between px-5 py-3 border-b" :class="isDark ? 'border-slate-700/50' : 'border-slate-100/50'">
        <span class="text-sm font-medium" :class="isDark ? 'text-slate-400' : 'text-slate-500'">自动检测 (中/英)</span>
        <button
          @click="clearAll"
          class="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
          :class="isDark ? 'hover:bg-red-500/10' : ''"
          title="清空输入内容"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>

      <textarea
        v-model="sourceText"
        @keydown="handleKeydown"
        class="flex-1 w-full bg-transparent resize-none p-5 pb-16 text-base leading-relaxed placeholder-slate-400 focus:outline-none transition-colors"
        :class="isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-700'"
        placeholder="在此输入需要翻译的中文或英文内容...&#10;Cmd/Ctrl + Enter 快捷翻译"
      ></textarea>

      <div
        class="p-4 flex justify-between items-center rounded-b-3xl absolute bottom-0 w-full pointer-events-none"
        :class="isDark ? 'bg-gradient-to-t from-slate-800/90 to-transparent' : 'bg-gradient-to-t from-slate-50/90 to-transparent'"
      >
        <span class="text-xs text-slate-400 font-medium ml-2 pointer-events-auto">{{ charCount }} 字符</span>
        <button
          :disabled="isLoading || !sourceText.trim()"
          @click="emit('translate')"
          class="flex items-center gap-2 px-6 py-2.5 text-white rounded-2xl shadow-md hover:shadow-lg transition-all font-medium pointer-events-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="isDark ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-800 hover:bg-slate-700'"
        >
          <Sparkles class="w-4 h-4" />
          <span>{{ isLoading ? '翻译中...' : '翻译' }}</span>
        </button>
      </div>
    </div>

    <!-- 中间箭头 -->
    <div class="hidden md:flex flex-col items-center justify-center z-10">
      <div
        class="w-10 h-10 rounded-full shadow-sm border flex items-center justify-center transition-all duration-300"
        :class="isDark ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-white border-slate-100 text-slate-400'"
      >
        <ArrowRightLeft class="w-5 h-5" />
      </div>
    </div>

    <!-- 翻译结果框 -->
    <div class="flex-1 flex flex-col rounded-3xl border shadow-inner-soft relative group" :class="isDark ? 'bg-blue-900/20 border-blue-800/30' : 'bg-blue-50/30 border-blue-100/50'">
      <div class="flex items-center justify-between px-5 py-3 border-b" :class="isDark ? 'border-blue-800/30' : 'border-blue-100/50'">
        <span class="text-sm font-medium" :class="isDark ? 'text-blue-400/80' : 'text-blue-600/80'">
          翻译结果
          <span v-if="isStreaming" class="ml-2 text-xs animate-pulse">打字中...</span>
        </span>
      </div>

      <div class="flex-1 relative">
        <div
          class="w-full h-full overflow-auto p-5 pb-16 text-base leading-relaxed whitespace-pre-wrap"
          :class="isDark ? 'text-slate-200' : 'text-slate-700'"
        >
          {{ targetText || '翻译结果将显示在这里...' }}
        </div>

        <div
          class="p-4 flex justify-end items-center rounded-b-3xl absolute bottom-0 w-full pointer-events-none"
          :class="isDark ? 'bg-gradient-to-t from-blue-900/20 to-transparent' : 'bg-gradient-to-t from-blue-50/90 to-transparent'"
        >
          <button
            @click="copyResult"
            :disabled="!targetText.trim()"
            class="flex items-center gap-2 px-5 py-2.5 rounded-2xl shadow-sm hover:shadow transition-all font-medium pointer-events-auto active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            :class="isDark ? 'bg-slate-700 border border-slate-600 text-blue-400 hover:bg-slate-600' : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'"
            title="复制翻译结果"
          >
            <Copy class="w-4 h-4" />
            <span>复制</span>
          </button>
        </div>

        <!-- 加载指示器 -->
        <div
          v-if="isLoading && !targetText"
          class="absolute inset-0 backdrop-blur-[2px] rounded-b-3xl flex flex-col items-center justify-center transition-opacity z-20"
          :class="isDark ? 'bg-slate-800/60' : 'bg-blue-50/60'"
        >
          <div class="w-8 h-8 border-4 rounded-full animate-spin mb-3" :class="isDark ? 'border-blue-700 border-t-blue-400' : 'border-blue-200 border-t-blue-500'"></div>
          <span class="text-sm font-medium animate-pulse" :class="isDark ? 'text-blue-400' : 'text-blue-600'">AI 正在思考...</span>
        </div>
      </div>
    </div>
  </main>
</template>
