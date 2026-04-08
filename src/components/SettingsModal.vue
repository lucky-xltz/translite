<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Settings2, X, Rocket, Keyboard, Sun, Moon, FileText } from 'lucide-vue-next'
import type { TranslateConfig } from '@/types'
import { DEFAULT_MODEL } from '@/types'

const props = defineProps<{
  open: boolean
  config: TranslateConfig
  configPath: string
  isDark: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [config: Partial<TranslateConfig>]
  toggleDark: []
}>()

const activeTab = ref<'model' | 'system' | 'changelog'>('model')
const inputApiKey = ref('')
const inputModel = ref('')
const inputBaseUrl = ref('')
const inputHotkey = ref('')
const isRecordingHotkey = ref(false)

const changelog = [
  {
    version: 'v0.1.0',
    date: '2026-04-08',
    changes: [
      '初始版本发布',
      '支持中英互译',
      '流式输出显示',
      '深色模式支持',
      '全局快捷键',
      '开机自动启动',
      '本地配置文件'
    ]
  }
]

watch(() => props.open, (isOpen) => {
  if (isOpen) {
    inputApiKey.value = props.config.apiKey
    inputModel.value = props.config.model
    inputBaseUrl.value = props.config.baseUrl || ''
    inputHotkey.value = props.config.hotkey || 'CmdOrCtrl+Shift+T'
    isRecordingHotkey.value = false
  }
})

function startRecording() {
  isRecordingHotkey.value = true
}

function handleKeydown(e: KeyboardEvent) {
  if (!isRecordingHotkey.value) return

  e.preventDefault()

  const parts: string[] = []

  if (e.ctrlKey) parts.push('Ctrl')
  if (e.metaKey) parts.push('Cmd')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')

  const key = e.key.toUpperCase()
  if (!['CONTROL', 'META', 'ALT', 'SHIFT'].includes(key)) {
    parts.push(key)
    inputHotkey.value = parts.join('+')
    isRecordingHotkey.value = false
  }
}

function stopRecording() {
  isRecordingHotkey.value = false
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function close() {
  emit('update:open', false)
}

function save() {
  if (activeTab.value === 'model') {
    emit('save', {
      apiKey: inputApiKey.value.trim(),
      model: inputModel.value.trim() || DEFAULT_MODEL,
      baseUrl: inputBaseUrl.value.trim() || ''
    })
  } else if (activeTab.value === 'system') {
    emit('save', {
      hotkey: inputHotkey.value.trim() || 'CmdOrCtrl+Shift+T'
    })
  }
  close()
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center opacity-100 transition-opacity duration-300"
  >
    <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col transition-transform duration-300 border border-slate-100">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Settings2 class="w-5 h-5 text-blue-500" />
          设置
        </h2>
        <button
          @click="close"
          class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="flex border-b border-slate-100">
        <button
          @click="activeTab = 'model'"
          :class="[
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'model'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          ]"
        >
          <Rocket class="w-4 h-4" />
          模型
        </button>
        <button
          @click="activeTab = 'system'"
          :class="[
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'system'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          ]"
        >
          <Keyboard class="w-4 h-4" />
          系统
        </button>
        <button
          @click="activeTab = 'changelog'"
          :class="[
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
            activeTab === 'changelog'
              ? 'text-blue-600 border-blue-600'
              : 'text-slate-500 border-transparent hover:text-slate-700'
          ]"
        >
          <FileText class="w-4 h-4" />
          更新
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <!-- 模型配置 -->
        <div v-if="activeTab === 'model'" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">API Key</label>
            <input
              type="password"
              v-model="inputApiKey"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all placeholder-slate-400"
              placeholder="请输入 API Key"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">模型名称</label>
            <input
              type="text"
              v-model="inputModel"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all"
              :placeholder="DEFAULT_MODEL"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">API Base URL (可选)</label>
            <input
              type="text"
              v-model="inputBaseUrl"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all placeholder-slate-400"
              placeholder="留空使用默认地址"
            />
          </div>
        </div>

        <!-- 系统设置 -->
        <div v-if="activeTab === 'system'" class="space-y-5">
          <!-- 主题切换 -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Sun v-if="!isDark" class="w-5 h-5 text-blue-600" />
                  <Moon v-else class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-slate-700">深色模式</h3>
                  <p class="text-xs text-slate-400 mt-0.5">切换应用主题外观</p>
                </div>
              </div>
              <button
                @click="emit('toggleDark')"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  isDark ? 'bg-blue-500' : 'bg-slate-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- 开机启动 -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Rocket class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-slate-700">开机自动启动</h3>
                  <p class="text-xs text-slate-400 mt-0.5">登录系统时自动启动轻译</p>
                </div>
              </div>
              <button
                @click="emit('save', { autoStart: !config.autoStart })"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  config.autoStart ? 'bg-blue-500' : 'bg-slate-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    config.autoStart ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- 全局快捷键 -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Keyboard class="w-5 h-5 text-purple-600" />
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-medium text-slate-700">全局快捷键</h3>
                <p class="text-xs text-slate-400 mt-0.5">快速呼出翻译窗口</p>
              </div>
            </div>
            <div class="mt-3">
              <div class="relative">
                <input
                  type="text"
                  readonly
                  :value="inputHotkey"
                  @click="startRecording"
                  @blur="stopRecording"
                  class="w-full bg-white border border-slate-200 text-blue-600 font-mono text-center text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none cursor-pointer transition-all"
                  :class="isRecordingHotkey ? 'ring-2 ring-blue-400 border-blue-400' : ''"
                  placeholder="点击后按下组合键"
                />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                  {{ isRecordingHotkey ? '按下任意键...' : '点击录制' }}
                </span>
              </div>
              <p class="text-xs text-slate-400 mt-1.5 ml-1">点击输入框，直接按下想要设置的按键 (如 Alt+T)</p>
            </div>
          </div>

          <!-- 配置文件 -->
          <div class="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <h3 class="text-sm font-medium text-blue-700 mb-2">配置文件路径</h3>
            <p class="text-xs text-blue-600/80 break-all">{{ configPath }}</p>
            <p class="text-xs text-blue-500/60 mt-2">可直接编辑此 JSON 文件修改配置</p>
          </div>
        </div>

        <!-- 更新日志 -->
        <div v-if="activeTab === 'changelog'" class="space-y-6">
          <div v-for="release in changelog" :key="release.version" class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">{{ release.version }}</span>
              <span class="text-xs text-slate-400">{{ release.date }}</span>
            </div>
            <ul class="space-y-2">
              <li
                v-for="(change, index) in release.changes"
                :key="index"
                class="flex items-start gap-2 text-sm text-slate-600"
              >
                <span class="text-blue-500 mt-1">•</span>
                <span>{{ change }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
        <button
          @click="close"
          class="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
        >
          取消
        </button>
        <button
          v-if="activeTab !== 'changelog'"
          @click="save"
          class="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-md rounded-xl transition-all active:scale-95"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
