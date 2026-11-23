<template>
  <BaseCard class="rounded-xl border border-epolia-border bg-epolia-surface p-epolia-md">
    <fieldset :disabled="disabled" class="min-w-0">
      <legend class="mb-epolia-sm w-full">
        <BaseTitle level="h2" class="flex items-start justify-between gap-epolia-xs text-start">
          <span class="min-w-0 wrap-anywhere">{{ domainLabel }}&nbsp;: vos spécialités</span>
          <ServiceDomainIcon
            :domain-id="domainId"
            :label="domainLabel"
            class="mt-epolia-2xs text-epolia-primary"
          />
        </BaseTitle>
      </legend>
      <div class="grid min-w-0 gap-epolia-sm">
        <template v-for="group in groups" :key="group.key">
          <div v-if="group.items.length" class="grid min-w-0 gap-epolia-xs">
            <p v-if="!group.selected" class="text-epolia-body-small text-epolia-text-secondary">
              {{ group.label }}
            </p>
            <div class="flex flex-wrap gap-epolia-xs">
              <label v-for="item in group.items" :key="item.id" class="relative max-w-full">
                <input
                  :id="prefix + item.id"
                  type="checkbox"
                  class="peer sr-only"
                  :aria-label="item.label"
                  :checked="group.selected"
                  @change="change(item, $event)"
                />
                <span
                  class="inline-flex min-h-12 cursor-pointer items-center gap-epolia-2xs rounded-xl bg-epolia-secondary-hover px-epolia-sm py-epolia-xs text-epolia-body-small text-epolia-primary peer-checked:bg-epolia-primary peer-checked:text-epolia-primary-text peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-epolia-focus peer-disabled:cursor-not-allowed forced-colors:peer-checked:underline"
                >
                  <span v-if="!group.selected" aria-hidden="true">+</span>
                  <span class="min-w-0 wrap-anywhere">{{ item.label }}</span>
                  <span v-if="group.selected" aria-hidden="true">×</span>
                </span>
              </label>
            </div>
          </div>
        </template>
      </div>
    </fieldset>
    <div class="grid gap-epolia-xs">
      <BaseButton
        label="Votre spécialité n’est pas dans la liste ? Demander son ajout"
        variant="tertiary"
        class="justify-self-start px-0 text-start font-normal"
        :aria-describedby="prefix + '-request-info'"
        disabled
      />
      <p :id="prefix + '-request-info'" class="text-epolia-body-small text-epolia-text-secondary">
        Une demande ne vous autorise pas à proposer cette prestation : elle est étudiée par l’équipe
        Epolia.
      </p>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import ServiceDomainIcon from '@/domains/services/components/ServiceDomainIcon.vue'
import { useServiceSpecialties } from '@/domains/services/composables/useServiceSpecialties'
import type { IStudentServiceDto } from '@/domains/services/models/dtos/serviceSelection.dto'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseCard from '@/shared/components/BaseCard.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const props = defineProps<{
  domainId: string
  domainLabel: string
  services: IStudentServiceDto[]
  selectedIds: string[]
  recommendedIds: string[]
  disabled?: boolean
}>()
const emit = defineEmits<{ toggle: [id: string, checked: boolean] }>()
const { prefix, groups, change } = useServiceSpecialties(props, emit)
</script>
