<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { Settings2, X, Rocket, Keyboard, Sun, Moon, FileText, RefreshCw, ExternalLink } from 'lucide-vue-next'
import type { TranslateConfig } from '@/types'
import { DEFAULT_MODEL } from '@/types'
import { useUpdateCheck } from '@/composables/useUpdateCheck'

const props = defineProps<{
  open: boolean
  config: TranslateConfig
  configPath: string
  isDark: boolean
  currentVersion: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [config: Partial<TranslateConfig>]
  toggleDark: []
}>()

const { updateInfo, checkForUpdate } = useUpdateCheck()

const activeTab = ref<'model' | 'system' | 'changelog'>('model')
const inputApiKey = ref('')
const inputModel = ref('')
const inputBaseUrl = ref('')
const inputHotkey = ref('')
const isRecordingHotkey = ref(false)

const changelog = [
  {
    version: 'v0.1.4',
    date: '2026-04-08',
    changes: [
      '升级 Node.js 22 修复构建问题',
      '改进翻译错误提示信息',
      '优化本地模型连接支持'
    ]
  },
  {
    version: 'v0.1.3',
    date: '2026-04-08',
    changes: [
      '修复本地模型连接 CSP 问题',
      '添加版本检查更新功能',
      '支持流式输出'
    ]
  },
  {
    version: 'v0.1.2',
    date: '2026-04-08',
    changes: [
      '修复 Windows/Linux 构建失败问题',
      '优化 GitHub Actions 多平台构建',
      '修复文件名中文乱码问题',
      '支持连接本地 AI 模型服务'
    ]
  },
  {
    version: 'v0.1.0',
    date: '2026-04-08',
    changes: [
      '初始版本发布',
      '支持中英互译',
      '全局快捷键 (Cmd+Shift+T)',
      '系统托盘后台运行',
      '开机自动启动',
      '深色模式支持',
      '本地配置文件管理'
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
    
    // 检查更新
    checkForUpdate()
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

async function handleCheckUpdate() {
  await checkForUpdate()
}

function openReleasePage() {
  if (updateInfo.value.release?.html_url) {
    window.open(updateInfo.value.release.html_url, '_blank')
  }
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-50 flex items-center justify-center opacity-100 transition-opacity duration-300 p-4"
  >
    <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col transition-transform duration-300 border border-slate-100">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
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

      <div class="flex border-b border-slate-100 shrink-0">
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
            <label class="block text-sm font-medium text-slate-700 mb-1">API Base URL</label>
            <input
              type="text"
              v-model="inputBaseUrl"
              class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-all placeholder-slate-400"
              placeholder="例如: http://localhost:1234/v1 或使用 OpenAI 兼容接口"
            />
            <p class="mt-1 text-xs text-slate-400">支持本地模型服务 (如 Ollama)、代理服务器或 OpenAI 兼容接口</p>
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
              <p class="text-xs text-slate-400 mt-1.5 ml-1">点击输入框，直接按下想要设置的按键组合</p>
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
          <!-- 版本检查 -->
          <div class="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText class="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 class="text-sm font-medium text-slate-700">
                    当前版本: v{{ currentVersion }}
                  </h3>
                  <p v-if="updateInfo.isChecking" class="text-xs text-slate-400 mt-0.5">
                    检查更新中...
                  </p>
                  <p v-else-if="updateInfo.error" class="text-xs text-red-500 mt-0.5">
                    {{ updateInfo.error }}
                  </p>
                  <p v-else-if="updateInfo.hasUpdate" class="text-xs text-green-600 mt-0.5">
                    发现新版本: {{ updateInfo.latestVersion }}
                  </p>
                  <p v-else class="text-xs text-slate-400 mt-0.5">
                    已是最新版本
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="updateInfo.hasUpdate"
                  @click="openReleasePage"
                  class="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink class="w-3 h-3" />
                  下载
                </button>
                <button
                  @click="handleCheckUpdate"
                  :disabled="updateInfo.isChecking"
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                  title="检查更新"
                >
                  <RefreshCw :class="['w-4 h-4', updateInfo.isChecking && 'animate-spin']" />
                </button>
              </div>
            </div>
          </div>

          <!-- 更新列表 -->
          <div v-for="release in changelog" :key="release.version" class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">{{ release.version }}</span>
              <span class="text-xs text-slate-400">{{ release.date }}</span>
              <span
                v-if="release.version === `v${currentVersion}`"
                class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full"
              >
                当前
              </span>
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
