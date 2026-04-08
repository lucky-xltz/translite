import { ref } from 'vue'

export interface GithubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  published_at: string
}

export interface UpdateInfo {
  currentVersion: string
  latestVersion: string
  release: GithubRelease | null
  hasUpdate: boolean
  isChecking: boolean
  error: string | null
}

export function useUpdateCheck() {
  const updateInfo = ref<UpdateInfo>({
    currentVersion: '0.1.4',
    latestVersion: '',
    release: null,
    hasUpdate: false,
    isChecking: false,
    error: null
  })

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
    compareVersions,
    setCurrentVersion
  }
}
