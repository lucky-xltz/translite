import { ref } from 'vue'
import { openUrl } from '@tauri-apps/plugin-opener'

export interface GithubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
  assets: Array<{
    name: string
    browser_download_url: string
  }>
}

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  release: GithubRelease | null
  hasUpdate: boolean
  isChecking: boolean
  isDownloading: boolean
  downloadProgress: number
  error: string | null
}

export function useUpdateCheck() {
  const updateInfo = ref<UpdateInfo>({
    currentVersion: '0.1.6',
    latestVersion: '',
    release: null,
    hasUpdate: false,
    isChecking: false,
    isDownloading: false,
    downloadProgress: 0,
    error: null
  })

  function getPlatformInfo() {
    const platform = navigator.platform.toLowerCase()
    const userAgent = navigator.userAgent.toLowerCase()
    
    let os: 'windows' | 'macos' | 'linux' = 'linux'
    let arch: 'x64' | 'aarch64' = 'x64'
    
    if (platform.includes('win') || userAgent.includes('win')) {
      os = 'windows'
    } else if (platform.includes('mac') || userAgent.includes('mac')) {
      os = 'macos'
      if (platform.includes('arm') || userAgent.includes('arm')) {
        arch = 'aarch64'
      }
    }
    
    return { os, arch }
  }

  async function checkForUpdate(): Promise<UpdateInfo> {
    updateInfo.value.isChecking = true
    updateInfo.value.error = null

    try {
      const response = await fetch(
        'https://api.github.com/repos/lucky-xltz/translite/releases/latest',
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'QingYi-App'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`检查更新失败: ${response.status}`)
      }

      const release: GithubRelease = await response.json()
      
      updateInfo.value.latestVersion = release.tag_name.replace('v', '')
      updateInfo.value.release = release
      updateInfo.value.hasUpdate = compareVersions(
        updateInfo.value.currentVersion,
        updateInfo.value.latestVersion
      ) < 0

      return updateInfo.value
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查更新失败'
      updateInfo.value.error = errorMessage
      throw err
    } finally {
      updateInfo.value.isChecking = false
    }
  }

  async function downloadAndInstall(): Promise<void> {
    if (!updateInfo.value.release) {
      throw new Error('没有可用的更新')
    }

    updateInfo.value.isDownloading = true
    updateInfo.value.downloadProgress = 0
    updateInfo.value.error = null

    try {
      const { os, arch } = getPlatformInfo()
      const release = updateInfo.value.release
      let downloadUrl = ''
      
      if (os === 'windows') {
        downloadUrl = release.assets.find(asset => 
          asset.name.includes('x64-setup.exe') || asset.name.includes('.exe')
        )?.browser_download_url || ''
      } else if (os === 'macos') {
        if (arch === 'aarch64') {
          downloadUrl = release.assets.find(asset => 
            asset.name.includes('aarch64.dmg')
          )?.browser_download_url || ''
        } else {
          downloadUrl = release.assets.find(asset => 
            asset.name.includes('x64.dmg') && !asset.name.includes('aarch64')
          )?.browser_download_url || ''
        }
      } else {
        downloadUrl = release.assets.find(asset => 
          asset.name.includes('.AppImage') || asset.name.includes('.deb') || asset.name.includes('.rpm')
        )?.browser_download_url || ''
      }

      if (!downloadUrl) {
        throw new Error(`未找到适合 ${os} ${arch} 的安装包`)
      }

      updateInfo.value.downloadProgress = 50

      await openUrl(downloadUrl)
      
      updateInfo.value.downloadProgress = 100
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '下载失败'
      updateInfo.value.error = errorMessage
      throw err
    } finally {
      updateInfo.value.isDownloading = false
    }
  }

  function compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number)
    const latestParts = latest.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const a = currentParts[i] || 0
      const b = latestParts[i] || 0

      if (a < b) return -1
      if (a > b) return 1
    }

    return 0
  }

  function setCurrentVersion(version: string) {
    updateInfo.value.currentVersion = version
  }

  return {
    updateInfo,
    checkForUpdate,
    downloadAndInstall,
    compareVersions,
    setCurrentVersion
  }
}
