<template>
  <p v-if="study?.title || study?.school" class="grid gap-epolia-2xs wrap-anywhere">
    <span v-if="study.title" class="text-epolia-body text-epolia-text">{{ study.title }}</span>
    <span v-if="study.school" class="text-epolia-body-small text-epolia-text-secondary">
      {{ study.school }}
    </span>
  </p>
  <BaseLoader v-if="state === 'loading'" loading label="Chargement des domaines…" />
  <div v-else-if="state === 'error'" class="grid gap-epolia-xs">
    <p role="alert">Impossible de charger toutes les prestations liées à vos études.</p>
    <BaseButton variant="secondary" label="Réessayer" @click="$emit('retry')" />
  </div>
  <p v-else-if="empty" role="status">Aucun domaine disponible pour le moment.</p>
  <p v-else-if="!hasAvailableDomain" role="status">
    Aucun domaine n’est actuellement associé à votre formation.
  </p>
</template>

<script setup lang="ts">
import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'
defineEmits<{ retry: [] }>()
defineProps<{
  study?: Pick<IEducationDto, 'title' | 'school'>
  state: 'loading' | 'error' | 'ready'
  empty: boolean
  hasAvailableDomain: boolean
}>()
</script>
