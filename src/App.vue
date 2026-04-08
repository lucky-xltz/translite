<script setup lang="ts">
import { ref, onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import TranslatePanel from '@/components/TranslatePanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'
import Toast from '@/components/Toast.vue'
import { useConfig } from '@/composables/useConfig'
import { useToast } from '@/composables/useToast'
import { useTranslate } from '@/composables/useTranslate'

const { config, configPath, loadConfig, saveConfig } = useConfig()
const { toastVisible, toastMessage, toastType, showToast } = useToast()
const { isLoading, translate } = useTranslate()

const sourceText = ref('')
const targetText = ref('')
const isStreaming = ref(false)
const settingsModalOpen = ref(false)
const isDark = ref(false)
const currentVersion = ref('0.1.4')

onMounted(async () => {
  await loadConfig()

  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
})

function applyTheme() {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function toggleDark() {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
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
      :current-version="currentVersion"
      @save="handleSaveSettings"
      @toggle-dark="toggleDark"
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
