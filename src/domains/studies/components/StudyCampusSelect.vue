<template>
  <div class="flex flex-col gap-epolia-xs">
    <BaseSearch
      :id="id"
      v-model="query"
      v-model:open="open"
      label="Établissement"
      placeholder="Nom de l’école ou commune"
      required
      overlay
      :maxlength="100"
      :selected="campus?.id"
      results-label="Établissements trouvés"
      :has-options="!!options.length"
      :message="message"
      :message-type="searchFailed && !campus ? 'error' : 'info'"
    >
      <BaseSearchOption
        v-for="option in options"
        :key="option.item.id"
        :value="option.item.id"
        :label="option.item.label"
        :description="option.location"
        @select="emit('select', option.item)"
      />
    </BaseSearch>
    <details v-if="campus && nameIsClipped" :key="campus.id" class="group">
      <summary
        class="flex w-fit min-h-12 cursor-pointer items-center rounded-epolia text-epolia-body-small font-semibold text-epolia-primary underline focus-visible:outline-2 focus-visible:outline-epolia-focus"
      >
        <span class="group-open:hidden">Voir le nom complet</span>
        <span class="hidden group-open:inline">Masquer le nom complet</span>
      </summary>
      <p class="text-epolia-body break-words">{{ campus.label }}</p>
    </details>
  </div>
</template>

<script setup lang="ts">
import BaseSearchOption from '@/shared/components/BaseSearchOption.vue'
import BaseSearch from '@/shared/components/BaseSearch.vue'
import { useStudyCampusSelect } from '@/domains/studies/composables/useStudyCampusSelect'
import type { ICampusDto } from '@/domains/studies/models/dtos/education.dto'

const props = defineProps<{
  id: string
  campus?: ICampusDto
  options: { item: ICampusDto; location: string }[]
  searchFailed: boolean
  searchHint: string
}>()
const query = defineModel<string>({ required: true })
const emit = defineEmits<{ select: [campus: ICampusDto] }>()
const { open, message, nameIsClipped } = useStudyCampusSelect(props, query)
</script>
