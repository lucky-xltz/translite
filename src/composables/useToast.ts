import { ref } from 'vue'
import type { ToastOptions } from '@/types'

const toastVisible = ref(false)
const toastMessage = ref('')
const toastType = ref<'success' | 'error' | 'info'>('success')
let toastTimeout: ReturnType<typeof setTimeout> | null = null

export function useToast() {
  function showToast(options: ToastOptions) {
    const { message, type = 'success', duration = 3300 } = options
    
    toastMessage.value = message
    toastType.value = type
    toastVisible.value = true

    if (toastTimeout) {
      clearTimeout(toastTimeout)
    }

    toastTimeout = setTimeout(() => {
      toastVisible.value = false
    }, duration)
  }

  function hideToast() {
    toastVisible.value = false
    if (toastTimeout) {
      clearTimeout(toastTimeout)
      toastTimeout = null
    }
  }

  return {
    toastVisible,
    toastMessage,
    toastType,
    showToast,
    hideToast
  }
}
