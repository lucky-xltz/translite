import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type { TranslateConfig } from '@/types'
import { DEFAULT_MODEL } from '@/types'
import { isEnabled, enable, disable } from '@tauri-apps/plugin-autostart'

interface RustConfig {
  api_key: string
  model: string
  base_url: string
  auto_start: boolean
  hotkey: string
}

export function useConfig() {
  const config = ref<TranslateConfig>({
    apiKey: '',
    model: DEFAULT_MODEL,
    baseUrl: '',
    autoStart: false,
    hotkey: 'CmdOrCtrl+Shift+T'
  })

  const configPath = ref('')
  const isLoaded = ref(false)

  async function loadConfig() {
    try {
      const rustConfig = await invoke<RustConfig>('load_config')
      config.value = {
        apiKey: rustConfig.api_key,
        model: rustConfig.model || DEFAULT_MODEL,
        baseUrl: rustConfig.base_url,
        autoStart: rustConfig.auto_start,
        hotkey: rustConfig.hotkey || 'CmdOrCtrl+Shift+T'
      }
      configPath.value = await invoke<string>('get_config_path_string')

      // 同步自动启动状态
      try {
        const autostartEnabled = await isEnabled()
        config.value.autoStart = autostartEnabled
      } catch (e) {
        console.error('Failed to check autostart status:', e)
      }

      isLoaded.value = true
    } catch (e) {
      console.error('加载配置失败:', e)
      isLoaded.value = true
    }
  }

  async function saveConfig(newConfig: Partial<TranslateConfig>) {
    if (newConfig.apiKey !== undefined) {
      config.value.apiKey = newConfig.apiKey
    }
    if (newConfig.model !== undefined) {
      config.value.model = newConfig.model || DEFAULT_MODEL
    }
    if (newConfig.baseUrl !== undefined) {
      config.value.baseUrl = newConfig.baseUrl
    }
    if (newConfig.autoStart !== undefined) {
      config.value.autoStart = newConfig.autoStart
    }
    if (newConfig.hotkey !== undefined) {
      config.value.hotkey = newConfig.hotkey
    }

    const rustConfig: RustConfig = {
      api_key: config.value.apiKey,
      model: config.value.model,
      base_url: config.value.baseUrl,
      auto_start: config.value.autoStart,
      hotkey: config.value.hotkey
    }

    try {
      await invoke('save_config', { config: rustConfig })
    } catch (e) {
      console.error('保存配置失败:', e)
    }

    // 处理自动启动
    if (newConfig.autoStart !== undefined) {
      try {
        if (newConfig.autoStart) {
          await enable()
        } else {
          await disable()
        }
      } catch (e) {
        console.error('设置自动启动失败:', e)
      }
    }

    // 处理快捷键
    if (newConfig.hotkey !== undefined) {
      try {
        await invoke('register_hotkey', { hotkey: newConfig.hotkey })
      } catch (e) {
        console.error('注册快捷键失败:', e)
      }
    }
  }

  async function clearConfig() {
    config.value = {
      apiKey: '',
      model: DEFAULT_MODEL,
      baseUrl: '',
      autoStart: false,
      hotkey: 'CmdOrCtrl+Shift+T'
    }

    try {
      await invoke('save_config', {
        config: {
          api_key: '',
          model: DEFAULT_MODEL,
          base_url: '',
          auto_start: false,
          hotkey: 'CmdOrCtrl+Shift+T'
        }
      })
    } catch (e) {
      console.error('清除配置失败:', e)
    }
  }

  return {
    config,
    configPath,
    isLoaded,
    loadConfig,
    saveConfig,
    clearConfig
  }
}
