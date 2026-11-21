<template>
  <BaseSearch
    :id="fieldId"
    v-model="address"
    v-model:open="open"
    label="Adresse de l’établissement (facultatif)"
    placeholder="Numéro, rue, code postal et commune"
    results-label="Adresses proposées"
    :has-options="!!options.length"
    :message="message"
    :maxlength="255"
    overlay
  >
    <BaseSearchOption
      v-for="option in options"
      :key="option.label"
      :value="option.label"
      :label="option.street"
      :description="option.locality"
      @select="choose(option)"
    />
  </BaseSearch>
</template>
<script setup lang="ts">
import BaseSearchOption from '@/shared/components/BaseSearchOption.vue'
import BaseSearch from '@/shared/components/BaseSearch.vue'
import { useManualSchoolAddress } from '@/domains/studies/composables/useManualSchoolAddress'

const address = defineModel<string>({ required: true })
const { fieldId, open, options, message, choose } = useManualSchoolAddress(address)
</script>
