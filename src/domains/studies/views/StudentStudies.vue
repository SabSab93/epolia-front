<template>
  <main class="epolia-screen-padding min-h-dvh bg-epolia-page text-epolia-text">
    <div class="mx-auto flex w-full max-w-md flex-col gap-epolia-lg">
      <header class="grid grid-cols-[1fr_auto_1fr] items-center gap-epolia-xs">
        <RouterLink
          :to="{ name: 'home' }"
          aria-label="Retour à l’accueil"
          class="flex min-h-12 min-w-12 items-center justify-center justify-self-start rounded-epolia focus-visible:outline-2 focus-visible:outline-epolia-primary"
        >
          <img :src="backIcon" alt="" />
        </RouterLink>
        <span class="text-center text-epolia-body font-semibold">Votre profil</span>
      </header>
      <BaseStepper :steps="steps" current-step-id="studies" />
      <div ref="intro" tabindex="-1" class="flex flex-col gap-epolia-xs outline-none">
        <BaseTitle level="h1">Vos études</BaseTitle>
        <p class="text-epolia-body text-epolia-text-secondary">
          Recherchez votre établissement et choisissez la formation que vous suivez. Vous pourrez
          consulter les prestations à l’étude pour votre cursus.
        </p>
      </div>
      <BaseLoader
        v-if="page === 'loading'"
        loading
        show-label
        label="Chargement de vos formations…"
      />
      <div v-else-if="page === 'error'" class="flex flex-col gap-epolia-sm">
        <BaseAlert
          variant="error"
          announcement="assertive"
          message="Impossible de charger vos formations. Réessayez pour reprendre votre profil."
        />
        <BaseButton variant="secondary" label="Réessayer" @click="load" />
      </div>
      <section
        v-else-if="page === 'list'"
        ref="recordsPanel"
        tabindex="-1"
        class="flex flex-col gap-epolia-md"
        aria-label="Vos formations enregistrées"
      >
        <BaseTitle level="h2">Vos formations enregistrées</BaseTitle>
        <p>Choisissez la formation à modifier.</p>
        <ul class="flex flex-col gap-epolia-xs">
          <li v-for="record in records" :key="record.id">
            <button
              type="button"
              class="w-full min-w-0 rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-md text-start break-words hover:border-epolia-primary focus-visible:outline-2 focus-visible:outline-epolia-primary"
              @click="edit(record.id)"
            >
              <span class="block font-semibold">{{ record.title }}</span>
              <span class="block text-epolia-body-small text-epolia-text-secondary">{{
                [record.school, record.level].filter(Boolean).join(' · ')
              }}</span>
              <span class="block text-epolia-body-small text-epolia-text-secondary">{{
                recordPeriod(record)
              }}</span>
              <span
                v-if="record.catalogOfferId && offerDetails[record.catalogOfferId]"
                class="block text-epolia-body-small text-epolia-text-secondary"
                >{{ offerDetails[record.catalogOfferId] }}</span
              >
              <span
                v-if="recordReference(record)"
                class="block text-epolia-body-small text-epolia-text-secondary"
                >{{ recordReference(record) }}</span
              >
            </button>
          </li>
        </ul>
        <BaseButton label="Ajouter une formation" @click="edit()" />
      </section>
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
          Vous pourrez reprendre cette formation depuis votre profil étudiant.
        </p>
        <BaseButton label="Retrouver mes formations" variant="secondary" @click="chooseRecord" />
        <RouterLink
          :to="{ name: 'home' }"
          class="inline-flex min-h-12 items-center justify-center rounded-epolia px-epolia-md font-semibold text-epolia-primary underline focus-visible:outline-2"
          >Retour à l’accueil</RouterLink
        >
      </section>
      <template v-else-if="page === 'form'">
        <BaseButton
          v-if="records.length"
          variant="tertiary"
          class="self-start px-0"
          label="Gérer mes formations"
          :disabled="busy"
          @click="chooseRecord"
        />
        <StudentEducationForm
          :key="selectedId || 'new'"
          :education="current"
          :reference="current ? recordReference(current) : undefined"
          :offer-detail="current?.catalogOfferId ? offerDetails[current.catalogOfferId] : undefined"
          @saved="onSaved"
          @busy="busy = $event"
          @dirty="dirty = $event"
        />
      </template>
    </div>
  </main>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import backIcon from '@/domains/studies/assets/back.svg'
import StudentEducationForm from '@/domains/studies/components/StudentEducationForm.vue'
import { useStudentStudies } from '@/domains/studies/composables/useStudentStudies'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseLoader from '@/shared/components/BaseLoader.vue'
import BaseStepper from '@/shared/components/BaseStepper.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const {
  steps,
  records,
  page,
  current,
  selectedId,
  busy,
  dirty,
  edit,
  chooseRecord,
  onSaved,
  load,
  recordPeriod,
  recordReference,
  offerDetails,
} = useStudentStudies()
</script>
