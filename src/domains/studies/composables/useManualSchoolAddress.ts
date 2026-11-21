import { ref, shallowRef, useId, watch, type Ref } from 'vue'
import { searchSchoolAddresses } from '@/domains/studies/api/schoolAddresses'
import type { SchoolAddressOptionTypes } from '@/domains/studies/models/types/schoolAddressOption.type'

export function useManualSchoolAddress(address: Ref<string>) {
  const fieldId = useId()
  const open = ref(false)
  const options = shallowRef<SchoolAddressOptionTypes[]>([])
  const message = ref('')
  const chosen = ref(address.value)

  watch(
    [open, address],
    ([isOpen, text], _, cleanup) => {
      options.value = []
      message.value = ''
      const term = text.trim()
      if (!isOpen || term.length < 3 || text === chosen.value) return
      const controller = new AbortController()
      const timer = setTimeout(async () => {
        try {
          const result = await searchSchoolAddresses(term, controller.signal)
          if (controller.signal.aborted) return
          options.value = result
          if (!result.length) message.value = 'Aucune suggestion. Vous pouvez garder votre saisie.'
        } catch {
          if (!controller.signal.aborted)
            message.value = 'Suggestions indisponibles. Vous pouvez saisir l’adresse complète.'
        }
      }, 300)
      cleanup(() => {
        clearTimeout(timer)
        controller.abort()
      })
    },
    { flush: 'sync' },
  )

  function choose(option: SchoolAddressOptionTypes) {
    chosen.value = option.label
    address.value = option.label
    open.value = false
  }

  return { fieldId, open, options, message, choose }
}
