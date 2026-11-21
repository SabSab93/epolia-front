import { computed, ref, watch, type Ref } from 'vue'
import { todayForStudies } from '@/domains/studies/models/education'

export function useStudyEndDate(start: Ref<string>, end: Ref<string>) {
  const today = ref(todayForStudies())
  // Native date inputs can emit years longer than the API's four-digit YYYY format.
  const apiDate = /^\d{4}-\d{2}-\d{2}$/
  const formatError = 'Saisissez une date avec une année à quatre chiffres.'
  const startDateError = computed(() => {
    if (start.value && !apiDate.test(start.value)) return formatError
    if (start.value > today.value)
      return 'La formation doit avoir commencé au plus tard aujourd’hui.'
    return ''
  })
  const validStart = computed(() => !!start.value && !startDateError.value)
  const firstYear = computed(() =>
    Math.max(Number(today.value.slice(0, 4)), Number(start.value.slice(0, 4)) + 1),
  )
  const years = computed(() =>
    [0, 1, 2].map((offset) => {
      const year = String(firstYear.value + offset)
      return { value: year, label: offset === 2 ? year + ' ou après' : year }
    }),
  )
  const savedYear = end.value.slice(0, 4)
  const selectedYear = ref(
    [...years.value].reverse().find((option) => option.value <= savedYear)?.value,
  )
  // Short courses can end this year even when the first suggested year is next year.
  const showExactDate = computed(
    () => !!selectedYear.value || !!end.value || firstYear.value > Number(today.value.slice(0, 4)),
  )
  const minimum = computed(() => {
    const firstDay = selectedYear.value ? selectedYear.value + '-01-01' : ''
    return firstDay > today.value ? firstDay : today.value
  })
  const maximum = computed(() =>
    selectedYear.value && selectedYear.value !== years.value[2]?.value
      ? selectedYear.value + '-12-31'
      : undefined,
  )
  const dateError = computed(() => {
    if (!end.value) return ''
    if (!apiDate.test(end.value)) return formatError
    if (end.value < today.value)
      return 'La formation doit être en cours. Choisissez aujourd’hui ou une date ultérieure.'
    if (end.value < minimum.value || (maximum.value && end.value > maximum.value)) {
      return 'La date saisie ne correspond pas à l’année choisie.'
    }
    return ''
  })
  watch(firstYear, () => {
    if (!years.value.some((option) => option.value === selectedYear.value))
      selectedYear.value = undefined
  })
  function omitEndDate() {
    end.value = ''
    selectedYear.value = undefined
  }
  return {
    today,
    validStart,
    startDateError,
    years,
    selectedYear,
    showExactDate,
    minimum,
    maximum,
    dateError,
    omitEndDate,
  }
}
