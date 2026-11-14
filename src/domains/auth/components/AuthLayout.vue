<script setup lang="ts">
import { onMounted, useTemplateRef, type VNodeChild } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import BaseHeader from '@/shared/components/BaseHeader.vue'

const props = defineProps<{
  title: string
  backTo: RouteLocationRaw
  backLabel: string
  wide?: boolean
}>()
defineSlots<{
  default(): VNodeChild
  links(): VNodeChild
}>()

const router = useRouter()
const content = useTemplateRef('content')

onMounted(() => content.value?.focus())

function goBack() {
  const destination = router.resolve(props.backTo)

  if (router.options.history.state.back === destination.fullPath) {
    router.back()
    return
  }

  router.replace(destination.fullPath)
}
</script>

<template>
  <main
    ref="content"
    tabindex="-1"
    :aria-label="title"
    class="epolia-screen-padding min-h-dvh bg-epolia-page text-epolia-text outline-none"
  >
    <div class="mx-auto flex flex-col gap-epolia-lg" :class="wide ? 'max-w-2xl' : 'max-w-md'">
      <BaseHeader :title="title" show-back :back-label="backLabel" @back="goBack" />
      <div class="min-w-0 break-words text-epolia-body">
        <slot />
      </div>
      <nav aria-label="Authentification" class="flex flex-col items-center gap-epolia-xs">
        <slot name="links" />
      </nav>
    </div>
  </main>
</template>
