import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it } from 'vitest'
import { nextTick, reactive } from 'vue'
import meta, {
  End,
  LongLabels,
  renderComposition,
  Start,
  type StepperStoryArgs,
} from '@/shared/components/BaseStepper.stories'

enableAutoUnmount(afterEach)

const statusOf = (wrapper: ReturnType<typeof mount>, index: number) =>
  wrapper.findAll('li')[index]!.text()

it('keeps the summary and the progress synchronized with Controls', async () => {
  const args = reactive<StepperStoryArgs>({ ...meta.args })
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('p').text()).toBe('Étape 4 sur 6 · Compétences')
  expect(wrapper.get('.base-stepper-fill').attributes('style')).toContain('67%')
  Object.assign(args, { currentStepId: 'studies' })
  await nextTick()
  expect(wrapper.get('p').text()).toBe('Étape 2 sur 6 · Études')
  Object.assign(args, { label: 'Création du profil' })
  await nextTick()
  expect(wrapper.get('nav').attributes('aria-label')).toBe('Création du profil')
})

it('covers the start and the end of the journey', () => {
  const start = { ...meta.args, ...Start.args }
  const startWrapper = mount(meta.render(start))
  expect(startWrapper.get('p').text()).toBe('Étape 1 sur 6 · Identité')
  expect(startWrapper.get('.base-stepper-fill').attributes('style')).toContain('17%')
  const end = { ...meta.args, ...End.args }
  const endWrapper = mount(meta.render(end))
  expect(endWrapper.get('p').text()).toBe('Étape 6 sur 6 · Récapitulatif')
  expect(endWrapper.get('.base-stepper-fill').attributes('style')).toContain('100%')
})

it('preserves long labels', () => {
  const args = { ...meta.args, ...LongLabels.args }
  const wrapper = mount(meta.render(args))
  expect(wrapper.get('p').text()).toContain(args.steps[2]!.label)
  expect(statusOf(wrapper, 0)).toContain(args.steps[0]!.label)
})

it('lets the screen own the current step and the completeness in a composition', async () => {
  const args = { ...meta.args, currentStepId: 'proof' }
  const wrapper = mount(renderComposition(args as StepperStoryArgs))
  const button = (label: string) => wrapper.findAll('button').find((b) => b.text() === label)!
  const summary = () => wrapper.get('nav p').text()
  expect(summary()).toBe('Étape 3 sur 6 · Justificatif')
  expect(wrapper.get('h2').text()).toBe('Justificatif')
  await button('Continuer').trigger('click')
  expect(summary()).toBe('Étape 4 sur 6 · Compétences')
  expect(statusOf(wrapper, 2)).toContain('Terminée')
  await button('Précédent').trigger('click')
  expect(summary()).toBe('Étape 3 sur 6 · Justificatif')
  expect(wrapper.findAll('nav button')).toHaveLength(0)
})

it('disables the previous action on the first step and finishes on the last', async () => {
  const first = mount(
    renderComposition({ ...meta.args, currentStepId: 'identity' } as StepperStoryArgs),
  )
  expect(first.findAll('button')[0]!.attributes('disabled')).toBeDefined()
  const last = mount(
    renderComposition({ ...meta.args, currentStepId: 'recap' } as StepperStoryArgs),
  )
  const finish = last.findAll('button').find((b) => b.text() === 'Terminer')!
  await finish.trigger('click')
  expect(last.get('nav p').text()).toBe('Étape 6 sur 6 · Récapitulatif')
  expect(statusOf(last, 5)).toContain('Étape en cours')
})
