<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import AppHeader from '@/components/AppHeader.vue'
import TranslatePanel from '@/components/TranslatePanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import Toast from '@/components/Toast.vue'
import { useConfig } from '@/composables/useConfig'
import { useToast } from '@/composables/useToast'
import { useTranslate } from '@/composables/useTranslate'
import { useUpdateCheck } from '@/composables/useUpdateCheck'

const { config, configPath, loadConfig, saveConfig } = useConfig()
const { toastVisible, toastMessage, toastType, showToast } = useToast()
const { isLoading, translate } = useTranslate()
const { setCurrentVersion } = useUpdateCheck()

const sourceText = ref('')
const targetText = ref('')
const isStreaming = ref(false)
const settingsModalOpen = ref(false)
const themeMode = ref<'light' | 'dark' | 'system'>('system')
const currentVersion = ref('')

const isDark = computed(() => {
  if (themeMode.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return themeMode.value === 'dark'
})

let mediaQuery: MediaQueryList | null = null

function handleSystemThemeChange(_e: MediaQueryListEvent) {
  if (themeMode.value === 'system') {
    applyTheme()
  }
}

onMounted(async () => {
  await loadConfig()

  // 获取当前应用版本
  try {
    currentVersion.value = await invoke<string>('get_version')
    setCurrentVersion(currentVersion.value)
  } catch (err) {
    console.error('获取版本失败:', err)
    currentVersion.value = '0.1.8' // fallback
    setCurrentVersion('0.1.8')
  }

  // 读取主题设置
  const savedTheme = localStorage.getItem('themeMode')
  if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
    themeMode.value = savedTheme as 'light' | 'dark' | 'system'
  }

  // 监听系统主题变化
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleSystemThemeChange)

  applyTheme()
})

onUnmounted(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }
})

function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function toggleDark() {
  // 在系统和自动切换之间循环
  if (themeMode.value === 'system') {
    themeMode.value = 'dark'
  } else if (themeMode.value === 'dark') {
    themeMode.value = 'light'
  } else {
    themeMode.value = 'system'
  }
  localStorage.setItem('themeMode', themeMode.value)
  applyTheme()
}

function setThemeMode(mode: 'light' | 'dark' | 'system') {
  themeMode.value = mode
  localStorage.setItem('themeMode', mode)
  applyTheme()
}

async function handleTranslate() {
  try {
    targetText.value = ''
    isStreaming.value = true

    await translate(sourceText.value, config.value, (chunk) => {
      targetText.value += chunk
    })

    isStreaming.value = false
    showToast({ message: '翻译完成', type: 'success' })
  } catch (error) {
    isStreaming.value = false
    const message = error instanceof Error ? error.message : '翻译失败'
    showToast({ message, type: 'error' })
  }
}

function handleCopy() {
  const textToCopy = targetText.value.trim()
  if (!textToCopy) {
    showToast({ message: '没有可复制的翻译内容', type: 'info' })
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = textToCopy
  textArea.style.cssText = 'position:fixed;top:0;left:0'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  try {
    const successful = document.execCommand('copy')
    if (successful) {
      showToast({ message: '翻译结果已复制', type: 'success' })
    } else {
      showToast({ message: '复制失败，请手动选择复制', type: 'error' })
    }
  } catch {
    showToast({ message: '复制异常', type: 'error' })
  } finally {
    document.body.removeChild(textArea)
  }
}

function handleSaveSettings(newConfig: Partial<{ apiKey: string; model: string; baseUrl: string; autoStart: boolean; hotkey: string }>) {
  saveConfig(newConfig)

  if (!newConfig.autoStart && !newConfig.hotkey) {
    showToast({ message: '配置已保存成功', type: 'success' })
  }
}
</script>

<template>
  <div class="window-container font-sans text-slate-800 antialiased selection:bg-blue-200 dark:text-slate-100">
    <div class="w-full h-full overflow-hidden flex flex-col">
      <AppHeader
        :is-dark="isDark"
        @open-settings="settingsModalOpen = true"
        @toggle-dark="toggleDark"
      />

      <TranslatePanel
        v-model:source-text="sourceText"
        v-model:target-text="targetText"
        :is-dark="isDark"
        :is-loading="isLoading"
        :is-streaming="isStreaming"
        @translate="handleTranslate"
        @copy="handleCopy"
      />
    </div>

    <SettingsModal
      v-model:open="settingsModalOpen"
      :config="config"
      :config-path="configPath"
      :is-dark="isDark"
      :theme-mode="themeMode"
      :current-version="currentVersion"
      @save="handleSaveSettings"
      @toggle-dark="toggleDark"
      @set-theme-mode="setThemeMode"
    />

    <Toast
      :visible="toastVisible"
      :message="toastMessage"
      :type="toastType"
    />
  </div>
</template>

<style>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

textarea:focus {
  outline: none;
}
</style>
