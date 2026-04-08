<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle, XCircle, Info } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  message: string
  type: 'success' | 'error' | 'info'
}>()

const positionStyle = computed(() => ({
  transform: 'translateX(-50%)',
  opacity: props.visible ? 1 : 0
}))
</script>

<template>
  <div
    v-if="visible"
    class="fixed top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 transition-all duration-300 z-50"
    :style="positionStyle"
  >
    <CheckCircle v-if="type === 'success'" class="w-5 h-5 text-green-400" />
    <XCircle v-else-if="type === 'error'" class="w-5 h-5 text-red-400" />
    <Info v-else class="w-5 h-5 text-blue-400" />
    <span class="text-sm font-medium">{{ message }}</span>
  </div>
</template>
