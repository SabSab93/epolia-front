import {
  computed,
  nextTick,
  onScopeDispose,
  ref,
  useId,
  useTemplateRef,
  watch,
  type Ref,
} from 'vue'
import type BaseButton from '@/shared/components/BaseButton.vue'

export function useBaseProfilePhotoPicker(
  photo: Ref<File | null>,
  limits: { acceptedTypes: readonly string[]; maxSizeBytes: number },
) {
  const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
  const pickerButton = useTemplateRef<InstanceType<typeof BaseButton>>('pickerButton')
  const helpId = useId()
  const errorId = useId()
  const previewUrl = ref('')
  const error = ref('')
  const pendingUrl = ref('')

  const accept = computed(() => limits.acceptedTypes.join(','))
  const formats = computed(() =>
    limits.acceptedTypes.map((type) => type.replace(/^image\//, '').toUpperCase()).join(', '),
  )
  const maxSize = computed(() =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 6 }).format(
      limits.maxSizeBytes / 1_000_000,
    ),
  )
  const status = computed(() => {
    if (pendingUrl.value) return 'Préparation de l’aperçu…'
    return photo.value ? `Aperçu local : ${photo.value.name}` : 'Aucune photo sélectionnée.'
  })

  watch(
    photo,
    (file, _, onCleanup) => {
      cancelPendingPreview()
      const url = file ? URL.createObjectURL(file) : ''
      previewUrl.value = url
      if (url) onCleanup(() => URL.revokeObjectURL(url))
    },
    { immediate: true },
  )
  onScopeDispose(cancelPendingPreview)

  function cancelPendingPreview() {
    if (!pendingUrl.value) return
    URL.revokeObjectURL(pendingUrl.value)
    pendingUrl.value = ''
  }

  function openPicker() {
    fileInput.value?.click()
  }

  function validateFile(file: File) {
    if (!file.type.startsWith('image/') || !limits.acceptedTypes.includes(file.type)) {
      return `Choisissez une image au format ${formats.value}.`
    }
    if (file.size > limits.maxSizeBytes) {
      return `Choisissez une image de ${maxSize.value} Mo maximum.`
    }
    return ''
  }

  async function selectPhoto(event: Event) {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    input.value = ''
    cancelPendingPreview()
    error.value = validateFile(file)
    if (error.value) return

    const url = URL.createObjectURL(file)
    pendingUrl.value = url
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (pendingUrl.value !== url) return

      error.value = validateFile(file)
      if (!error.value) photo.value = file
    } catch {
      if (pendingUrl.value === url)
        error.value = 'Impossible d’ouvrir cette image. Choisissez une autre photo.'
    } finally {
      if (pendingUrl.value === url) cancelPendingPreview()
    }
  }

  async function removePhoto() {
    cancelPendingPreview()
    error.value = ''
    photo.value = null
    await nextTick()
    const button = pickerButton.value?.$el as HTMLButtonElement | undefined
    button?.focus()
  }

  return {
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
  }
}
