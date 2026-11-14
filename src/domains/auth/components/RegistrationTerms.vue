<template>
  <section class="flex flex-col gap-epolia-md" aria-labelledby="registration-terms-title">
    <div
      ref="reader"
      role="region"
      aria-label="Texte des conditions d’utilisation"
      tabindex="0"
      class="max-h-[50dvh] overflow-y-auto border border-epolia-border bg-epolia-surface p-epolia-md sm:p-epolia-lg focus-visible:outline-2 focus-visible:outline-epolia-focus"
      @scroll="checkEnd"
    >
      <article
        ref="documentContent"
        class="flex flex-col gap-epolia-lg text-epolia-body text-epolia-text"
      >
        <div class="flex flex-col gap-epolia-sm">
          <h2
            id="registration-terms-title"
            ref="heading"
            tabindex="-1"
            class="font-sans text-xl font-semibold"
          >
            {{ terms.title }}
          </h2>
          <p>{{ terms.introduction }}</p>
        </div>
        <section
          v-for="(section, index) in terms.sections"
          :key="section.title"
          class="flex flex-col gap-epolia-xs"
        >
          <h3 class="font-sans text-base font-semibold">{{ index + 1 }}. {{ section.title }}</h3>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>
      </article>
    </div>
    <div class="flex flex-wrap gap-epolia-xs">
      <BaseButton label="Refuser" variant="secondary" class="flex-1" @click="emit('decline')" />
      <BaseButton label="Accepter" class="flex-1" :disabled="!reachedEnd" @click="accept" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import terms from '@/domains/auth/content/cgu-test-v1.json'

const emit = defineEmits<{ accept: []; decline: [] }>()
const heading = useTemplateRef('heading')
const reader = useTemplateRef('reader')
const documentContent = useTemplateRef('documentContent')
const reachedEnd = ref(false)
let stopObserving: (() => void) | undefined

function checkEnd() {
  const region = reader.value
  if (region && region.scrollTop + region.clientHeight >= region.scrollHeight - 1) {
    reachedEnd.value = true
  }
}

function accept() {
  if (reachedEnd.value) emit('accept')
}

onMounted(() => {
  heading.value?.focus({ preventScroll: true })
  checkEnd()
  const Observer = reader.value?.ownerDocument.defaultView?.ResizeObserver
  if (Observer && reader.value && documentContent.value) {
    const observer = new Observer(checkEnd)
    observer.observe(reader.value)
    observer.observe(documentContent.value)
    stopObserving = () => observer.disconnect()
  }
})

onUnmounted(() => stopObserving?.())
</script>
