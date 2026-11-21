<template>
  <div class="flex min-w-0 flex-col gap-epolia-xs">
    <BaseInput
      v-if="freeEntry"
      :id="fieldId"
      v-model="title"
      label="Intitulé de la formation"
      required
      :maxlength="150"
    />
    <BaseSearch
      v-else
      :id="fieldId"
      v-model="query"
      v-model:open="open"
      label="Intitulé de la formation"
      placeholder="Intitulé de la formation"
      required
      :maxlength="150"
      :selected="title"
      results-label="Formations proposées par l’Onisep"
      :has-options="!!titles.length"
      :message="hint"
      :message-type="state === 'error' ? 'error' : 'info'"
      @reach-end="showMore"
    >
      <BaseSearchOption
        v-for="suggestion in titles"
        :key="suggestion"
        :value="suggestion"
        :label="suggestion"
        @select="choose(suggestion)"
      />
    </BaseSearch>
    <BaseButton
      class="self-start px-0"
      variant="tertiary"
      :label="freeEntry ? 'Choisir une formation dans la liste' : 'Saisir le nom de ma formation'"
      @click="toggleEntry"
    />
  </div>
</template>

<script setup lang="ts">
import BaseSearchOption from '@/shared/components/BaseSearchOption.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseSearch from '@/shared/components/BaseSearch.vue'
import BaseInput from '@/shared/components/BaseInput.vue'
import { useManualEducationTitle } from '@/domains/studies/composables/useManualEducationTitle'

const title = defineModel<string>({ required: true })
const draft = defineModel<string>('draft', { default: '' })
const { fieldId, query, titles, showMore, open, freeEntry, hint, state, choose, toggleEntry } =
  useManualEducationTitle(title, draft)
</script>
