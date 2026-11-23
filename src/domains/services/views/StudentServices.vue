<template>
  <p v-if="options.length" class="text-epolia-body-small text-epolia-text-secondary">
    <template v-if="accessibleDomainCount > 1">
      Ouvrez les domaines qui vous intéressent, puis ajoutez vos prestations dans chaque carte.
    </template>
    <template v-else>
      Seuls les domaines liés à vos études sont accessibles. Choisissez les prestations que vous
      souhaitez proposer.
    </template>
  </p>
  <BaseLoader
    v-if="state === 'loading'"
    loading
    show-label
    label="Chargement de vos prestations…"
  />
  <div v-else-if="state === 'error'" class="flex flex-col gap-epolia-md">
    <BaseAlert
      variant="error"
      announcement="assertive"
      message="Impossible de charger vos prestations."
    />
    <BaseButton label="Réessayer" variant="secondary" @click="retry" />
  </div>
  <p v-else-if="state === 'no-profile'">
    Enregistrez d’abord vos études pour retrouver les prestations disponibles.
  </p>
  <form v-else-if="snapshot" class="flex min-w-0 flex-col gap-epolia-lg" @submit.prevent="submit">
    <div class="grid gap-epolia-xs">
      <BaseTitle v-if="options.length" id="student-domain-title" level="h2">
        {{ accessibleDomainCount > 1 ? 'Vos domaines' : 'Votre domaine' }}
      </BaseTitle>
      <div
        v-if="options.length"
        role="group"
        aria-labelledby="student-domain-title"
        class="grid grid-cols-2 gap-epolia-xs"
      >
        <BaseButton
          v-for="option in visibleDomains"
          :key="option.value"
          :label="option.label"
          :value="option.value"
          variant="secondary"
          class="min-w-0 justify-start px-epolia-sm text-start text-epolia-body-small font-normal wrap-anywhere aria-expanded:bg-epolia-secondary-hover aria-expanded:inset-ring-1 aria-expanded:inset-ring-epolia-primary"
          :disabled="saving || option.disabled"
          :aria-expanded="isDomainOpen(option.value)"
          :aria-controls="
            isDomainOpen(option.value)
              ? 'specialties-' + encodeURIComponent(option.value)
              : undefined
          "
          @click="toggleDomain(option.value)"
        >
          <template #icon-left>
            <ServiceDomainIcon :domain-id="option.value" :label="option.label" />
          </template>
          <template v-if="isDomainOpen(option.value)" #icon-right>
            <BaseIcon :icon="CheckIcon" :size="20" class="ms-auto" />
          </template>
        </BaseButton>
        <BaseButton
          v-if="options.length > 5"
          variant="secondary"
          class="justify-start border-dashed px-epolia-sm text-start text-epolia-body-small font-normal"
          :aria-expanded="allDomainsVisible"
          :label="allDomainsVisible ? 'Voir moins de domaines' : 'Voir les autres domaines'"
          @click="allDomainsVisible = !allDomainsVisible"
        >
          <template #icon-left><BaseIcon :icon="AppsIcon" :size="20" /></template>
        </BaseButton>
      </div>
      <StudyServicePreview
        :study="study"
        :state="catalogueState"
        :empty="!options.length"
        :has-available-domain="hasAvailableDomain"
      />
    </div>
    <ServiceSpecialties
      v-for="group in openDomains"
      :id="'specialties-' + encodeURIComponent(group.value)"
      :key="group.value"
      :domain-id="group.value"
      :domain-label="group.label"
      :services="group.services"
      :selected-ids="ids"
      :recommended-ids="recommendedIds"
      :disabled="saving"
      @toggle="toggle"
    />
    <section
      v-if="removals.length && (canSaveOnAccount || !valid) && snapshot.revision"
      class="flex flex-col gap-epolia-xs"
      aria-label="Prestations à retirer"
    >
      <p>
        En enregistrant ce choix, vous retirerez les prestations suivantes et leurs éventuels tarifs
        associés.
      </p>
      <ul class="list-inside list-disc">
        <li v-for="item in removals" :key="item.id">{{ item.label }}</li>
      </ul>
    </section>
    <p v-if="valid && !canSave && catalogueState !== 'loading'" role="status">
      Votre compte ou votre formation n’a pas pu être identifié. Rouvrez l’étape pour enregistrer
      vos choix.
    </p>
    <BaseAlert v-if="message" variant="warning" announcement="assertive" :message="message" />
    <BaseAlert
      v-if="success"
      variant="success"
      announcement="polite"
      message="Vos choix sont enregistrés dans votre brouillon."
    />
    <BaseButton
      v-if="hasAvailableDomain"
      type="submit"
      label="Enregistrer mes choix"
      :loading="saving"
      :disabled="!canSave || success || (localSaved && !canSaveOnAccount)"
    />
    <BaseModal
      v-model:open="confirmRemoval"
      title="Retirer ces prestations ?"
      description="Les éventuels tarifs associés seront également retirés."
      confirmation
    >
      <ul class="list-inside list-disc">
        <li v-for="item in removals" :key="item.id">{{ item.label }}</li>
      </ul>
      <template #actions
        ><BaseButton label="Confirmer le retrait et enregistrer" @click="save"
      /></template>
    </BaseModal>
  </form>
</template>
<script setup lang="ts">
import CheckIcon from '~icons/material-symbols/check-circle'
import AppsIcon from '~icons/material-symbols/apps'
import BaseTitle from '@/shared/components/BaseTitle.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'
import StudyServicePreview from '@/domains/services/components/StudyServicePreview.vue'
import { useStudentServices } from '@/domains/services/composables/useStudentServices'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import ServiceDomainIcon from '@/domains/services/components/ServiceDomainIcon.vue'
import ServiceSpecialties from '@/domains/services/components/ServiceSpecialties.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'
import BaseModal from '@/shared/components/BaseModal.vue'
const emit = defineEmits<{ saved: []; restored: [saved: boolean] }>()
const {
  snapshot,
  options,
  visibleDomains,
  hasAvailableDomain,
  accessibleDomainCount,
  openDomains,
  isDomainOpen,
  allDomainsVisible,
  ids,
  removals,
  valid,
  canSave,
  canSaveOnAccount,
  localSaved,
  study,
  catalogueState,
  recommendedIds,
  state,
  saving,
  success,
  message,
  confirmRemoval,
  retry,
  submit,
  save,
  toggle,
  toggleDomain,
} = useStudentServices(emit)
</script>
