<template>
  <main
    ref="content"
    tabindex="-1"
    :aria-label="title"
    class="epolia-screen-padding min-h-dvh bg-epolia-page text-epolia-text outline-none"
  >
    <div class="mx-auto flex flex-col gap-epolia-lg" :class="wide ? 'max-w-2xl' : 'max-w-md'">
      <BaseHeader
        :title="title"
        show-back
        :back-label="backLabel"
        @back="goBack(backTo, backAction)"
      />
      <div class="min-w-0 break-words text-epolia-body">
        <slot />
      </div>
      <nav aria-label="Authentification" class="flex flex-col items-center gap-epolia-xs">
        <slot name="links" />
      </nav>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef, type VNodeChild } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { useAuthLayout } from '@/domains/auth/composables/useAuthLayout'
import BaseHeader from '@/shared/components/BaseHeader.vue'

defineProps<{
  title: string
  backTo: RouteLocationRaw
  backLabel: string
  backAction?: () => void
  wide?: boolean
}>()
defineSlots<{
  default(): VNodeChild
  links(): VNodeChild
}>()

const { goBack } = useAuthLayout()
const content = useTemplateRef('content')

onMounted(() => content.value?.focus())
</script>
