import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAppStatusStore = defineStore('appStatus', () => {
  const bootstrappedAt = ref(new Date().toISOString())
  const isReady = computed(() => Boolean(bootstrappedAt.value))

  return {
    bootstrappedAt,
    isReady,
  }
})
