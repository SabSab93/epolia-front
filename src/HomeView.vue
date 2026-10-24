<script setup lang="ts">
import { getActivePinia } from 'pinia'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import { apiBaseUrl } from '@/shared/api/apiClient'

const isPiniaReady = Boolean(getActivePinia())
</script>

<template>
  <main class="flex min-h-dvh flex-col bg-epolia-page px-epolia-md py-epolia-xl text-epolia-text">
    <section class="mx-auto flex w-full max-w-md flex-1 flex-col justify-between">
      <div class="space-y-epolia-xl">
        <div class="space-y-epolia-sm">
          <p class="text-epolia-body font-semibold uppercase tracking-wide text-epolia-primary">
            Epolia
          </p>
          <BaseTitle level="h1">Socle mobile prêt à évoluer</BaseTitle>
          <p class="text-epolia-body text-epolia-text-secondary">
            Vue, Router, Pinia et Tailwind sont branchés pour démarrer l'application mobile.
          </p>
        </div>

        <dl class="grid gap-epolia-sm">
          <div class="rounded-lg border border-epolia-border bg-epolia-surface p-epolia-md">
            <dt class="text-epolia-body-small text-epolia-text-secondary">Router</dt>
            <dd class="mt-epolia-2xs text-epolia-body font-semibold">Vue Router actif</dd>
          </div>
          <div class="rounded-lg border border-epolia-border bg-epolia-surface p-epolia-md">
            <dt class="text-epolia-body-small text-epolia-text-secondary">Pinia</dt>
            <dd class="mt-epolia-2xs text-epolia-body font-semibold">
              {{ isPiniaReady ? 'Store disponible' : 'Store en attente' }}
            </dd>
          </div>
          <div class="rounded-lg border border-epolia-border bg-epolia-surface p-epolia-md">
            <dt class="text-epolia-body-small text-epolia-text-secondary">API</dt>
            <dd class="mt-epolia-2xs break-all text-epolia-body-small">{{ apiBaseUrl }}</dd>
          </div>
        </dl>
      </div>

      <div class="pt-epolia-xl">
        <BaseButton label="Démarrer" class="w-full" />
      </div>
    </section>
  </main>
</template>
