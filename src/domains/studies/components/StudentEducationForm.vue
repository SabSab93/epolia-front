<template>
  <form novalidate class="flex min-w-0 flex-col gap-epolia-lg" @submit.prevent="save">
    <fieldset :disabled="saving" class="flex min-w-0 flex-col gap-epolia-lg">
      <legend class="sr-only">Formation de l’étudiant</legend>
      <template v-if="mode === 'stored' && education">
        <div ref="storedPanel" tabindex="-1" class="flex flex-col gap-epolia-xs break-words">
          <p class="text-epolia-body-small text-epolia-text-secondary">Formation enregistrée</p>
          <BaseTitle level="h2">{{ education.title }}</BaseTitle>
          <p>{{ [education.school, education.level].filter(Boolean).join(' · ') }}</p>
          <p v-if="education.studyField" class="text-epolia-body-small text-epolia-text-secondary">
            Famille d’études · {{ education.studyField.label }}
          </p>
          <p v-if="offerDetail" class="text-epolia-body-small text-epolia-text-secondary">
            {{ offerDetail }}
          </p>
          <p
            v-if="reference || education.catalogOfferId"
            class="text-epolia-body-small text-epolia-text-secondary"
          >
            {{ reference || 'Réf. ' + education.catalogOfferId }}
          </p>
        </div>
        <BaseButton
          variant="secondary"
          label="Choisir une autre formation"
          @click="changeEntryMode('catalog')"
        />
      </template>
      <template v-if="mode === 'catalog'">
        <StudyCampusSelect
          :id="searchId"
          v-model="schoolSearch"
          :campus="campus"
          :options="campusOptions"
          :search-hint="searchHint"
          :search-failed="searchState === 'error'"
          @select="selectCampus"
        />
        <BaseButton
          v-if="searchState === 'error'"
          label="Réessayer la recherche"
          variant="secondary"
          @click="retrySearch"
        />
        <div class="course-field flex min-w-0 flex-col gap-epolia-xs">
          <BaseSelect
            v-model="offerId"
            label="Formation et niveau"
            :options="offerOptions"
            placeholder="Sélectionnez votre formation"
            :empty-message="!campus ? 'Choisissez d’abord votre établissement.' : undefined"
            required
          />
          <template v-if="offerState !== 'ready' || !offerOptions.length">
            <p v-if="offerState === 'loading'" role="status">Chargement des formations…</p>
            <p v-else-if="offerState === 'ready'" role="status">
              Aucune formation référencée pour cet établissement.
            </p>
            <template v-else-if="offerState === 'error' || offerState === 'removed'">
              <BaseAlert
                variant="warning"
                announcement="polite"
                :message="
                  offerState === 'removed'
                    ? 'Ce campus ne figure plus dans le catalogue.'
                    : 'La liste des formations de ce campus est indisponible.'
                "
              />
              <BaseButton
                v-if="offerState === 'error'"
                label="Recharger les formations"
                variant="secondary"
                @click="retryOffers"
              />
            </template>
          </template>
          <template v-if="education && !selectionChanged">
            <p
              v-if="education.studyField"
              class="text-epolia-body-small text-epolia-text-secondary"
            >
              Famille d’études · {{ education.studyField.label }}
            </p>
            <p
              v-if="reference || savedOfferUnavailable"
              class="text-epolia-body-small text-epolia-text-secondary"
            >
              {{ reference || 'Réf. ' + education.catalogOfferId }}
            </p>
          </template>
        </div>
      </template>
      <div v-if="mode !== 'manual'" class="flex flex-col">
        <p v-if="mode === 'catalog'" class="text-epolia-body-small text-epolia-text-secondary">
          Vous ne trouvez pas votre établissement ou votre formation dans la liste ?
        </p>
        <BaseButton
          variant="tertiary"
          class="self-start px-0"
          label="Saisir ma formation manuellement"
          @click="changeEntryMode('manual')"
        />
      </div>
      <template v-else>
        <BaseButton
          variant="tertiary"
          class="self-start px-0 text-start"
          :label="fromCatalog ? 'Retour aux établissements' : 'Rechercher un établissement'"
          @click="changeEntryMode('catalog')"
        >
          <template v-if="fromCatalog" #icon-left>
            <img :src="backIcon" alt="" class="size-5 shrink-0" />
          </template>
        </BaseButton>
        <BaseInput
          :id="manualSchoolId"
          v-model="school"
          label="Établissement"
          required
          :maxlength="150"
        />
        <ManualSchoolAddress v-if="addressEnabled" v-model="schoolAddress" />
        <ManualEducationTitle v-model="title" v-model:draft="titleDraft" />
      </template>
      <BaseButton
        v-if="education && (selectionChanged || (education.source === 'MANUAL' && dirty))"
        variant="tertiary"
        class="self-start px-0"
        label="Garder la formation enregistrée"
        @click="restoreOriginal"
      />

      <div class="flex flex-col gap-epolia-sm">
        <BaseInput
          :id="startId"
          v-model="start"
          label="Début des études"
          type="date"
          required
          :max="today"
          :error="startError"
        />
        <div v-if="validStart" class="flex flex-col gap-epolia-xs">
          <BaseChoiceButtons
            v-model="selectedYear"
            legend="Date de fin d’études prévue (facultative)"
            :options="years"
          />
          <BaseInput
            v-if="showExactDate"
            v-model="end"
            label="Date exacte (facultative)"
            type="date"
            :min="minimum"
            :max="maximum"
            :error="dateError"
          />
          <BaseButton
            v-if="selectedYear || end"
            variant="tertiary"
            class="self-start"
            label="Laisser la date à préciser"
            @click="omitEndDate"
          />
        </div>
      </div>
    </fieldset>
    <p v-if="education && dirty" class="text-epolia-body-small text-epolia-text-secondary">
      Si votre profil est publié, enregistrer une modification le remettra en brouillon. Les
      prestations qui ne correspondent plus à vos études seront retirées de votre sélection.
    </p>
    <BaseAlert :message="error" announcement="assertive" variant="error" />
    <BaseButton
      type="submit"
      label="Enregistrer ma formation"
      :disabled="!canSave"
      :loading="saving"
    />
  </form>
</template>

<script setup lang="ts">
import ManualSchoolAddress from '@/domains/studies/components/ManualSchoolAddress.vue'
import backIcon from '@/assets/svg/back.svg'
import ManualEducationTitle from '@/domains/studies/components/ManualEducationTitle.vue'
import StudyCampusSelect from '@/domains/studies/components/StudyCampusSelect.vue'
import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'
import { useStudentEducationForm } from '@/domains/studies/composables/useStudentEducationForm'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseChoiceButtons from '@/shared/components/BaseChoiceButtons.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const props = defineProps<{ education?: IEducationDto; reference?: string; offerDetail?: string }>()
const emit = defineEmits<{
  saved: [row: IEducationDto]
  busy: [value: boolean]
  dirty: [value: boolean]
}>()
const {
  mode,
  schoolSearch,
  searchHint,
  campus,
  offerId,
  title,
  titleDraft,
  school,
  start,
  end,
  error,
  saving,
  canSave,
  searchState,
  retrySearch,
  offerState,
  retryOffers,
  savedOfferUnavailable,
  campusOptions,
  offerOptions,
  selectionChanged,
  years,
  selectedYear,
  today,
  validStart,
  showExactDate,
  omitEndDate,
  minimum,
  maximum,
  dateError,
  dirty,
  searchId,
  manualSchoolId,
  addressEnabled,
  schoolAddress,
  startId,
  startError,
  selectCampus,
  changeEntryMode,
  fromCatalog,
  restoreOriginal,
  save,
} = useStudentEducationForm(props.education, emit)
</script>

<style scoped>
.course-field :deep([role='combobox']) {
  background-repeat: no-repeat;
  background-position: left var(--spacing-epolia-md) center;
  padding-inline-start: var(--spacing-epolia-2xl);
  background-image: url('@/domains/studies/assets/book.svg');
}
</style>
