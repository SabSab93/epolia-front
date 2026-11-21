<template>
  <form novalidate class="flex min-w-0 flex-col gap-epolia-lg" @submit.prevent="save">
    <fieldset :disabled="saving" class="flex min-w-0 flex-col gap-epolia-lg">
      <legend class="sr-only">Formation de l’étudiant</legend>
      <template v-if="mode === 'stored' && education">
        <div
          ref="storedPanel"
          tabindex="-1"
          class="flex flex-col gap-epolia-xs rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-md break-words"
        >
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
        <BaseButton variant="secondary" label="Choisir une autre formation" @click="searchAgain" />
      </template>
      <template v-if="mode === 'catalog'">
        <div class="school-field flex flex-col gap-epolia-xs">
          <template v-if="campus">
            <p class="font-semibold">Établissement</p>
            <p
              ref="chosenCampus"
              tabindex="-1"
              class="rounded-epolia border border-epolia-primary bg-epolia-surface p-epolia-sm break-words"
            >
              <strong>{{ campus.label }}</strong
              ><br />{{ [campus.city, campus.address].filter(Boolean).join(' · ') }}
            </p>
            <BaseButton
              variant="tertiary"
              class="self-start px-0"
              label="Changer d’établissement"
              @click="searchAgain"
            />
          </template>
          <template v-else>
            <BaseInput
              :id="searchId"
              v-model="query"
              label="Établissement"
              placeholder="Nom de l’école ou commune"
              autocomplete="off"
              :maxlength="100"
              help="Recherchez un campus de Grenoble ou des communes de sa métropole."
            />
            <p
              v-if="searchState === 'loading'"
              role="status"
              class="text-epolia-body-small text-epolia-text-secondary"
            >
              Recherche des établissements…
            </p>
            <p
              v-else-if="searchState === 'ready'"
              role="status"
              class="text-epolia-body-small text-epolia-text-secondary"
            >
              {{
                campusOptions.length
                  ? campusOptions.length === 1
                    ? '1 établissement trouvé.'
                    : campusOptions.length + ' établissements trouvés.'
                  : 'Aucun établissement trouvé. Essayez un autre nom ou la saisie libre.'
              }}
            </p>
            <template v-else-if="searchState === 'error'">
              <BaseAlert
                variant="warning"
                announcement="polite"
                message="La recherche des établissements est indisponible."
              />
              <BaseButton label="Réessayer la recherche" variant="secondary" @click="retrySearch" />
            </template>
            <ul
              v-if="campusOptions.length"
              aria-label="Établissements trouvés"
              class="flex max-h-64 flex-col gap-epolia-xs overflow-y-auto py-epolia-2xs"
            >
              <li v-for="option in campusOptions" :key="option.item.id">
                <button
                  type="button"
                  class="min-h-12 w-full rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-sm text-start break-words hover:border-epolia-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-epolia-primary"
                  @click="selectCampus(option.item)"
                >
                  <span class="block font-semibold">{{ option.item.label }}</span>
                  <span class="block text-epolia-body-small text-epolia-text-secondary">{{
                    option.location
                  }}</span>
                </button>
              </li>
            </ul>
          </template>
        </div>
        <div class="course-field flex min-w-0 flex-col gap-epolia-xs">
          <BaseSelect
            v-if="offerOptions.length"
            v-model="offerId"
            label="Formation et niveau"
            :options="offerOptions"
            placeholder="Sélectionnez votre formation"
            required
          />
          <template v-else>
            <BaseInput
              class="course-field"
              label="Formation et niveau"
              :model-value="''"
              :placeholder="
                campus ? 'Formations du campus' : 'Choisissez d’abord votre établissement'
              "
              disabled
            />
            <p v-if="offerState === 'loading'" role="status">Chargement des formations…</p>
            <p v-else-if="offerState === 'ready'" role="status">
              Ce campus n’a aucune formation référencée. Vous pouvez utiliser la saisie libre.
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
          <a
            href="https://www.data.gouv.fr/datasets/ideo-actions-de-formation-initiale-univers-enseignement-superieur"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-12 items-center self-start text-epolia-body-small text-epolia-primary underline"
            >Données Onisep</a
          >
        </div>
      </template>
      <BaseButton
        v-if="mode !== 'manual'"
        variant="tertiary"
        class="self-start px-0"
        label="Saisir ma formation manuellement"
        @click="enterManual"
      />
      <template v-else>
        <div class="flex flex-col gap-epolia-xs">
          <BaseTitle level="h2">Saisie libre</BaseTitle>
          <p class="text-epolia-body-small text-epolia-text-secondary">
            Votre formation sera conservée dans votre brouillon. La saisie libre n’ouvre aucune
            prestation.
          </p>
        </div>
        <BaseInput :id="manualSchoolId" v-model="school" label="Établissement" :maxlength="150" />
        <BaseInput v-model="title" label="Intitulé de la formation" required :maxlength="150" />
        <BaseInput
          v-model="level"
          label="Niveau (facultatif)"
          placeholder="Ex. Bac + 5"
          :maxlength="150"
        />
        <BaseButton
          variant="tertiary"
          class="self-start px-0"
          label="Rechercher dans le catalogue"
          @click="searchAgain"
        />
      </template>
      <BaseButton
        v-if="education && mode !== 'stored' && education.source !== 'MANUAL'"
        variant="tertiary"
        class="self-start px-0"
        label="Garder la formation enregistrée"
        @click="restoreOriginal"
      />

      <section
        v-if="previewId"
        class="flex flex-col gap-epolia-sm"
        aria-label="Prestations associées à la formation"
      >
        <BaseTitle level="h2">Prestations à l’étude</BaseTitle>
        <p v-if="candidateState === 'loading'" role="status">Chargement des prestations…</p>
        <template v-else-if="candidateState === 'error' || candidateState === 'removed'">
          <BaseAlert
            variant="warning"
            announcement="polite"
            :message="
              candidateState === 'removed'
                ? 'Cette offre ne figure plus dans le catalogue. Votre saisie reste accessible.'
                : 'L’aperçu des prestations est indisponible. Vous pouvez enregistrer votre formation.'
            "
          />
          <BaseButton
            v-if="candidateState === 'error'"
            variant="secondary"
            label="Recharger les prestations"
            @click="retryCandidates"
          />
        </template>
        <template v-else-if="candidateState === 'ready'">
          <p role="status" class="text-epolia-body-small text-epolia-text-secondary">
            {{
              candidates.length
                ? 'Ces pistes sont à l’étude pour votre formation. Elles ne sont pas encore ouvertes aux missions.'
                : 'Aucune prestation associée à cette formation pour le moment.'
            }}
          </p>
          <ul v-if="candidates.length" class="flex flex-col gap-epolia-xs">
            <li
              v-for="candidate in candidates"
              :key="candidate.id"
              class="rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-md break-words"
            >
              <p class="font-semibold">{{ candidate.label }}</p>
              <p class="text-epolia-body-small text-epolia-text-secondary">
                {{ candidate.description }}
              </p>
            </li>
          </ul>
        </template>
      </section>
      <div class="flex flex-col gap-epolia-sm">
        <p class="text-epolia-body-small text-epolia-text-secondary">
          Vous pouvez enregistrer ce brouillon sans dates. Les dates de début et de fin sont
          nécessaires au calcul des prestations autorisées pour une formation en cours.
        </p>
        <BaseInput v-model="start" label="Début des études (facultatif)" type="date" />
        <BaseInput
          v-model="end"
          label="Fin des études prévue (facultatif)"
          type="date"
          :min="start || undefined"
          :error="
            validDates
              ? undefined
              : 'La fin prévue doit suivre le début des études ou correspondre au même jour.'
          "
        />
      </div>
    </fieldset>
    <BaseAlert :message="error" announcement="assertive" variant="error" />
    <BaseButton type="submit" label="Continuer" :loading="saving" />
  </form>
</template>

<script setup lang="ts">
import type { Education } from '@/domains/studies/models/education'
import { useStudentEducationForm } from '@/domains/studies/composables/useStudentEducationForm'
import BaseAlert from '@/shared/components/BaseAlert.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import BaseSelect from '@/shared/components/BaseSelect.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const props = defineProps<{ education?: Education; reference?: string; offerDetail?: string }>()
const emit = defineEmits<{
  saved: [row: Education]
  busy: [value: boolean]
  dirty: [value: boolean]
}>()
const {
  mode,
  query,
  campus,
  offerId,
  title,
  school,
  level,
  start,
  end,
  error,
  saving,
  searchState,
  retrySearch,
  offerState,
  retryOffers,
  candidateState,
  retryCandidates,
  previewId,
  candidates,
  campusOptions,
  offerOptions,
  validDates,
  searchId,
  manualSchoolId,
  selectCampus,
  searchAgain,
  enterManual,
  restoreOriginal,
  save,
} = useStudentEducationForm(
  props.education,
  (row) => emit('saved', row),
  (value) => emit('busy', value),
  (value) => emit('dirty', value),
)
</script>

<style scoped>
@layer utilities {
  .school-field :deep(input),
  .course-field :deep(input),
  .course-field :deep([role='combobox']) {
    background-repeat: no-repeat;
    background-position: left var(--spacing-epolia-md) center;
    padding-inline-start: var(--spacing-epolia-2xl);
  }
  .school-field :deep(input) {
    background-image: url('@/domains/studies/assets/search.svg');
  }
  .course-field :deep(input),
  .course-field :deep([role='combobox']) {
    background-image: url('@/domains/studies/assets/book.svg');
  }
}
</style>
