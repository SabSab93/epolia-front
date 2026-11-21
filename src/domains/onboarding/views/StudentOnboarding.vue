<template>
  <main
    v-if="active"
    class="epolia-screen-padding min-h-dvh bg-epolia-page text-epolia-text [--epolia-screen-block:var(--spacing-epolia-sm)]"
  >
    <div class="mx-auto flex w-full max-w-md flex-col gap-epolia-md">
      <header class="grid grid-cols-[1fr_auto_1fr] items-center gap-epolia-xs">
        <RouterLink
          :to="backTo"
          :aria-label="backLabel"
          class="flex min-h-12 min-w-12 items-center justify-center justify-self-start rounded-epolia focus-visible:outline-2 focus-visible:outline-epolia-primary"
        >
          <img :src="backIcon" alt="" />
        </RouterLink>
        <span class="text-center text-epolia-body font-semibold">Votre profil</span>
      </header>
      <BaseStepper
        :steps="progress"
        :status-labels="statusLabels"
        :current-step-id="active.id"
        label="Progression des étapes disponibles"
      />
      <BaseTitle ref="heading" level="h1" tabindex="-1" class="outline-none">
        {{ active.title }}
      </BaseTitle>
      <RouterView v-slot="{ Component }">
        <component
          :is="Component"
          :key="replay ? active.id + '-dev' : active.id"
          @restored="restoreStep"
          @saved="advanceAfterSave"
        />
      </RouterView>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import backIcon from '@/assets/svg/back.svg'
import { useStudentOnboarding } from '@/domains/onboarding/composables/useStudentOnboarding'
import BaseStepper from '@/shared/components/BaseStepper.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const { active, replay, backTo, backLabel, progress, statusLabels, restoreStep, advanceAfterSave } =
  useStudentOnboarding()
</script>
