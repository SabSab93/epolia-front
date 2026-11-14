<template>
  <main
    ref="content"
    tabindex="-1"
    class="epolia-screen-padding grid min-h-dvh place-items-center bg-epolia-secondary-hover text-epolia-text outline-none [--epolia-screen-block:var(--spacing-epolia-xl)]"
  >
    <section class="w-full max-w-sm space-y-epolia-xl">
      <div class="space-y-epolia-xs text-center">
        <BaseTitle level="h1" class="text-epolia-primary">Epolia</BaseTitle>
        <p class="text-epolia-body text-epolia-text-secondary">
          Trouvez un étudiant pour une mission ou proposez vos services.
        </p>
      </div>

      <div class="flex flex-col gap-epolia-xs">
        <BaseButton
          label="S’inscrire"
          variant="primary"
          class="w-full"
          @click="router.push({ name: 'choose-role' })"
        />
        <BaseButton
          label="Se connecter"
          variant="secondary"
          class="w-full"
          @click="router.push({ name: 'login' })"
        />
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const router = useRouter()
const content = useTemplateRef('content')

onMounted(() => content.value?.focus())
</script>
