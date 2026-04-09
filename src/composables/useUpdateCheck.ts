import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { remove, exists, stat } from '@tauri-apps/plugin-fs'
import { exit } from '@tauri-apps/plugin-process'

export interface GithubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
  assets: Array<{
    name: string
    browser_download_url: string
    size: number
  }>
}

export type DownloadStatus = 'idle' | 'downloading' | 'downloaded' | 'installing' | 'error'

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  release: GithubRelease | null
  hasUpdate: boolean
  isChecking: boolean
  status: DownloadStatus
  downloadProgress: number
  downloadedSize: number
  totalSize: number
  error: string | null
  retryCount: number
  filePath: string | null
  autoInstallTriggered: boolean
  installMessage: string | null
}

export function useUpdateCheck() {
  const updateInfo = ref<UpdateInfo>({
    currentVersion: '0.1.6',
    latestVersion: '',
    release: null,
    hasUpdate: false,
    isChecking: false,
    status: 'idle',
    downloadProgress: 0,
    downloadedSize: 0,
    totalSize: 0,
    error: null,
    retryCount: 0,
    filePath: null,
    autoInstallTriggered: false,
    installMessage: null
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
      console.log('开始检查更新...')
      const response = await fetch(
        'https://api.github.com/repos/lucky-xltz/translite/releases/latest',
        {
          method: 'GET',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'QingYi-App'
          }
        }
      )

      console.log('API 响应状态:', response.status)

      if (!response.ok) {
        throw new Error(`检查更新失败: ${response.status}`)
      }

      const release: GithubRelease = await response.json()
      console.log('获取到的版本:', release.tag_name)

      updateInfo.value.latestVersion = release.tag_name.replace('v', '')
      updateInfo.value.release = release
      updateInfo.value.hasUpdate = compareVersions(
        updateInfo.value.currentVersion,
        updateInfo.value.latestVersion
      ) < 0

      console.log('是否有更新:', updateInfo.value.hasUpdate)

      return updateInfo.value
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '检查更新失败'
      console.error('检查更新错误:', err)
      updateInfo.value.error = errorMessage
      return updateInfo.value
    } finally {
      updateInfo.value.isChecking = false
    }
  }

  async function getDownloadUrl(release: GithubRelease): Promise<string> {
    const { os, arch } = getPlatformInfo()
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

    return downloadUrl
  }

  async function downloadAndInstall(): Promise<void> {
    if (!updateInfo.value.release) {
      throw new Error('没有可用的更新')
    }

    updateInfo.value.status = 'downloading'
    updateInfo.value.downloadProgress = 0
    updateInfo.value.downloadedSize = 0
    updateInfo.value.error = null

    try {
      const release = updateInfo.value.release
      const downloadUrl = await getDownloadUrl(release)

      if (!downloadUrl) {
        throw new Error('未找到适合当前系统的安装包')
      }

      const asset = release.assets.find(a => a.browser_download_url === downloadUrl)
      const expectedSize = asset?.size || 0
      updateInfo.value.totalSize = expectedSize

      const downloadDir = await invoke<string>('get_download_dir')
      const fileName = asset?.name || `update-${release.tag_name}`
      const filePath = `${downloadDir}/${fileName}`

      console.log('开始下载:', downloadUrl)
      console.log('保存到:', filePath)

      await invoke('download_file', {
        url: downloadUrl,
        destPath: filePath
      })

      updateInfo.value.downloadProgress = 100
      updateInfo.value.filePath = filePath
      updateInfo.value.retryCount = 0

      console.log('下载完成，准备安装')
      updateInfo.value.status = 'downloaded'
      updateInfo.value.autoInstallTriggered = false

    } catch (err) {
      console.error('下载错误:', err)
      const errorMessage = err instanceof Error ? err.message : '下载失败'
      updateInfo.value.status = 'error'
      updateInfo.value.error = errorMessage
      throw err
    }
  }

  async function cancelDownload(): Promise<void> {
    if (updateInfo.value.filePath) {
      try {
        await remove(updateInfo.value.filePath)
      } catch (err) {
        console.error('清理临时文件失败:', err)
      }
    }

    updateInfo.value.status = 'idle'
    updateInfo.value.downloadProgress = 0
    updateInfo.value.downloadedSize = 0
    updateInfo.value.retryCount = 0
    updateInfo.value.error = null
    updateInfo.value.filePath = null
  }

  async function verifyDownloadedFile(): Promise<boolean> {
    if (!updateInfo.value.filePath) {
      return false
    }

    try {
      const fileExists = await exists(updateInfo.value.filePath)
      if (!fileExists) {
        updateInfo.value.status = 'error'
        updateInfo.value.error = '文件不存在，请重新下载'
        return false
      }

      const fileStat = await stat(updateInfo.value.filePath)

      if (updateInfo.value.totalSize > 0 && fileStat.size !== updateInfo.value.totalSize) {
        updateInfo.value.status = 'error'
        updateInfo.value.error = '文件已损坏，请重新下载'
        await remove(updateInfo.value.filePath)
        return false
      }

      return true
    } catch (err) {
      updateInfo.value.status = 'error'
      updateInfo.value.error = '文件验证失败，请重新下载'
      return false
    }
  }

  async function installUpdate(): Promise<void> {
    if (!updateInfo.value.filePath) {
      throw new Error('没有可安装的文件')
    }

    const isValid = await verifyDownloadedFile()
    if (!isValid) {
      return
    }

    updateInfo.value.status = 'installing'

    try {
      console.log('打开安装包:', updateInfo.value.filePath)
      await invoke('open_file', { filePath: updateInfo.value.filePath })

      setTimeout(async () => {
        console.log('退出应用')
        await exit(0)
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '打开安装包失败'
      updateInfo.value.status = 'error'
      updateInfo.value.error = errorMessage
      throw err
    }
  }

  async function retryDownload(): Promise<void> {
    updateInfo.value.status = 'idle'
    updateInfo.value.error = null
    updateInfo.value.retryCount = 0
    await downloadAndInstall()
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

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  return {
    updateInfo,
    checkForUpdate,
    downloadAndInstall,
    cancelDownload,
    verifyDownloadedFile,
    installUpdate,
    retryDownload,
    compareVersions,
    setCurrentVersion,
    formatBytes
  }
}
