<template>
  <fieldset class="flex min-w-0 flex-col gap-epolia-sm">
    <legend class="mb-epolia-xs text-epolia-body font-semibold">Photo de profil</legend>
    <div class="flex flex-wrap items-center gap-epolia-md">
      <BaseAvatar :src="previewUrl" :initials="initials" alt="" size="xl" />
      <div class="flex flex-wrap gap-epolia-xs">
        <BaseButton
          ref="pickerButton"
          :label="photo ? 'Remplacer la photo' : 'Choisir une photo'"
          variant="secondary"
          :aria-describedby="error ? `${helpId} ${errorId}` : helpId"
          @click="openPicker"
        />
        <BaseButton v-if="photo" label="Retirer la photo" variant="tertiary" @click="removePhoto" />
      </div>
    </div>
    <input ref="fileInput" type="file" :accept="accept" hidden @change="selectPhoto" />
    <p :id="helpId" class="text-epolia-body-small text-epolia-text-secondary">
      {{ formats }}. {{ maxSize }} Mo maximum.
    </p>
    <p role="status" class="text-epolia-body-small text-epolia-text-secondary wrap-anywhere">
      {{ status }}
    </p>
    <p :id="errorId" role="alert" class="text-epolia-body-small text-epolia-error">
      {{ error }}
    </p>
  </fieldset>
</template>

<script setup lang="ts">
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import { useBaseProfilePhotoPicker } from '@/shared/composables/useBaseProfilePhotoPicker'

const props = defineProps<{
  acceptedTypes: readonly string[]
  maxSizeBytes: number
  initials?: string
}>()
const photo = defineModel<globalThis.File | null>({ required: true })
const {
  accept,
  formats,
  maxSize,
  helpId,
  errorId,
  previewUrl,
  error,
  status,
  openPicker,
  selectPhoto,
  removePhoto,
} = useBaseProfilePhotoPicker(photo, props)
</script>
