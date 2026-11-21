import { computed, ref, useTemplateRef, watch } from 'vue'
import type BaseTitle from '@/shared/components/BaseTitle.vue'
import { useRoute, useRouter } from 'vue-router'
import { studentSteps, stepDestination, isStudentReplay } from '@/domains/onboarding/studentSteps'

export function useStudentOnboarding() {
  const route = useRoute()
  const router = useRouter()
  const heading = useTemplateRef<InstanceType<typeof BaseTitle>>('heading')
  const replay = computed(() => isStudentReplay(route.query))
  const completed = ref<Record<string, boolean | undefined>>({})
  const index = computed(() => studentSteps.findIndex((step) => step.id === route.meta.studentStep))
  const active = computed(() => studentSteps[index.value])
  const previous = computed(() => studentSteps[index.value - 1])
  function destinationForStep(id: string) {
    const destination = stepDestination(id)
    return replay.value ? { ...destination, query: { recommencer: '1' } } : destination
  }
  const backTo = computed(() =>
    previous.value ? destinationForStep(previous.value.id) : { name: 'home' },
  )
  const backLabel = computed(() =>
    previous.value ? 'Retour à ' + previous.value.title : 'Retour à l’accueil',
  )
  const progress = computed(() =>
    studentSteps.map((step, position) => ({
      id: step.id,
      label: step.title,
      completed: completed.value[step.id] ?? (position < index.value ? null : undefined),
    })),
  )

  const statusLabels = computed(() =>
    active.value && completed.value[active.value.id] ? { current: 'Terminée' } : undefined,
  )

  // The active form loads its own draft. On direct entry, check only earlier
  // steps whose state we have not already heard from a form.
  watch(
    [index, replay],
    ([position, restarting], [, wasRestarting], onCleanup) => {
      if (restarting !== wasRestarting) completed.value = {}
      if (restarting) return
      const request = new AbortController()
      onCleanup(() => request.abort())
      for (const step of studentSteps.slice(0, Math.max(0, position))) {
        if (completed.value[step.id] !== undefined) continue
        void step.hasSavedData(request.signal).then(
          (saved) => {
            if (!request.signal.aborted) completed.value[step.id] = saved
          },
          () => {
            /* An unavailable draft has unknown completion. */
          },
        )
      }
    },
    { immediate: true },
  )

  function restoreStep(saved: boolean) {
    if (active.value) completed.value[active.value.id] = saved
  }
  function advanceAfterSave() {
    if (!active.value) return
    restoreStep(true)
    const next = studentSteps[index.value + 1]
    if (next) void router.push(destinationForStep(next.id))
  }
  watch([active, replay, heading], () => heading.value?.$el.focus(), { flush: 'post' })

  return {
    active,
    replay,
    backTo,
    backLabel,
    stepCounter: computed(() => `${index.value + 1}/${studentSteps.length}`),
    progress,
    statusLabels,
    restoreStep,
    advanceAfterSave,
  }
}
