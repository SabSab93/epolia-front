<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import { apiBaseUrl } from '@/services/api'
import { useAppStatusStore } from '@/stores/appStatus'

const appStatus = useAppStatusStore()
</script>

<template>
  <main class="min-h-screen bg-[#f7f7f4] px-5 py-8 text-slate-900">
    <section class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col justify-between">
      <div class="space-y-8">
        <div class="space-y-3">
          <p class="text-sm font-semibold uppercase tracking-wide text-teal-700">Epolia</p>
          <h1 class="text-4xl font-bold leading-tight">Socle mobile prêt à évoluer</h1>
          <p class="text-base leading-7 text-slate-700">
            Vue, Router, Pinia et Tailwind sont branchés pour démarrer l'application mobile.
          </p>
        </div>

        <dl class="grid gap-3">
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <dt class="text-sm font-medium text-slate-500">Router</dt>
            <dd class="mt-1 text-lg font-semibold">Vue Router actif</dd>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <dt class="text-sm font-medium text-slate-500">Pinia</dt>
            <dd class="mt-1 text-lg font-semibold">
              {{ appStatus.isReady ? 'Store disponible' : 'Store en attente' }}
            </dd>
          </div>
          <div class="rounded-lg border border-slate-200 bg-white p-4">
            <dt class="text-sm font-medium text-slate-500">API</dt>
            <dd class="mt-1 break-all text-sm font-semibold">{{ apiBaseUrl }}</dd>
          </div>
        </dl>
      </div>

      <div class="pt-8">
        <BaseButton label="Démarrer" class="w-full" />
      </div>
    </section>
  </main>
</template>
