<template>
  <div class="flex flex-col gap-epolia-xs">
    <p class="text-epolia-body text-epolia-text-secondary">
      Choisissez votre établissement et votre formation pour compléter votre profil étudiant.
    </p>
  </div>
  <BaseLoader v-if="page === 'loading'" loading show-label label="Chargement de vos formations…" />
  <div v-else-if="page === 'error'" class="flex flex-col gap-epolia-sm">
    <BaseAlert
      variant="error"
      announcement="assertive"
      message="Impossible de charger vos formations. Réessayez pour reprendre votre profil."
    />
    <BaseButton variant="secondary" label="Réessayer" @click="load" />
  </div>
  <section
    v-else-if="page === 'saved'"
    ref="savedPanel"
    tabindex="-1"
    class="flex flex-col gap-epolia-md"
    aria-label="Confirmation"
  >
    <BaseAlert
      variant="success"
      announcement="polite"
      title="Formation enregistrée"
      :message="current?.title ?? 'Vos études sont enregistrées.'"
    />
    <p class="text-epolia-body-small text-epolia-text-secondary">
      Vous pouvez modifier cette formation depuis votre parcours étudiant.
    </p>
    <RouterLink
      :to="{ name: 'home' }"
      class="inline-flex min-h-12 items-center justify-center rounded-epolia px-epolia-md font-semibold text-epolia-primary underline focus-visible:outline-2"
      >Retour à l’accueil</RouterLink
    >
  </section>
  <StudentEducationForm
    v-else-if="page === 'form'"
    :education="current"
    :offer-detail="offerDetail"
    @saved="onSaved"
    @busy="busy = $event"
    @dirty="dirty = $event"
  />
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import StudentEducationForm from '@/domains/studies/components/StudentEducationForm.vue'
import { useStudentStudies } from '@/domains/studies/composables/useStudentStudies'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'

const props = defineProps<{ resumeRecordId?: string }>()
const emit = defineEmits<{ saved: [recordId: string]; restored: [saved: boolean] }>()
const { current, page, busy, dirty, offerDetail, onSaved, load } = useStudentStudies(
  emit,
  props.resumeRecordId,
)
</script>
