import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import BaseStepper, { type StepperStep } from '@/shared/components/BaseStepper.vue'

enableAutoUnmount(afterEach)

const steps: StepperStep[] = [
  { id: 'identity', label: 'Identité', completed: true },
  { id: 'studies', label: 'Études' },
  { id: 'skills', label: 'Compétences' },
  { id: 'recap', label: 'Récapitulatif' },
]

function statusTexts(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('li').map((item) => item.text())
}

describe('BaseStepper', () => {
  it('announces the named current step in an accessible navigation landmark', () => {
    const wrapper = mount(BaseStepper, { props: { steps, currentStepId: 'studies' } })
    expect(wrapper.element.tagName).toBe('NAV')
    expect(wrapper.attributes('aria-label')).toBe('Progression du parcours')
    expect(wrapper.get('p').text()).toBe('Étape 2 sur 4 · Études')
    expect(wrapper.get('p').attributes('aria-live')).toBe('polite')
    const current = wrapper.findAll('[aria-current="step"]')
    expect(current).toHaveLength(1)
    expect(current[0]!.text()).toContain('Études')
  })

  it('derives the visual progress from the current position only', async () => {
    const wrapper = mount(BaseStepper, { props: { steps, currentStepId: 'identity' } })
    const fill = () => wrapper.get('.base-stepper-fill').attributes('style')
    expect(fill()).toContain('25%')
    await wrapper.setProps({ currentStepId: 'skills' })
    expect(fill()).toContain('75%')
    await wrapper.setProps({ currentStepId: 'recap' })
    expect(fill()).toContain('100%')
    expect(wrapper.get('.base-stepper-track').attributes('aria-hidden')).toBe('true')
  })

  it('keeps real completeness separate from position and never invents it', () => {
    const wrapper = mount(BaseStepper, { props: { steps, currentStepId: 'recap' } })
    expect(statusTexts(wrapper)).toEqual([
      'Identité : Terminée',
      'Études : À compléter',
      'Compétences : À compléter',
      'Récapitulatif : Étape en cours',
    ])
  })

  it('lists every step with its status for assistive technologies only', () => {
    const wrapper = mount(BaseStepper, { props: { steps, currentStepId: 'studies' } })
    expect(wrapper.get('ol').classes()).toContain('sr-only')
    expect(statusTexts(wrapper)).toEqual([
      'Identité : Terminée',
      'Études : Étape en cours',
      'Compétences : À venir',
      'Récapitulatif : À venir',
    ])
  })

  it('is purely informative: no button, no link, no event', () => {
    const wrapper = mount(BaseStepper, { props: { steps, currentStepId: 'skills' } })
    expect(wrapper.find('button, a, [tabindex]').exists()).toBe(false)
    expect(wrapper.emitted()).toEqual({})
  })

  it('degrades safely when the current step is unknown or the list is empty', () => {
    const unknown = mount(BaseStepper, { props: { steps, currentStepId: 'missing' } })
    expect(unknown.find('[aria-current]').exists()).toBe(false)
    expect(unknown.get('.base-stepper-fill').attributes('style')).toContain('0%')
    expect(unknown.get('p').text()).toBe('4 étapes')
    const none = mount(BaseStepper, { props: { steps: [] } })
    expect(none.get('.base-stepper-fill').attributes('style')).toContain('0%')
    expect(none.findAll('li')).toHaveLength(0)
  })

  it('renders every step and a single current step when ids are duplicated', () => {
    const wrapper = mount(BaseStepper, {
      props: {
        steps: [
          { id: 'same', label: 'Première' },
          { id: 'same', label: 'Seconde' },
        ],
        currentStepId: 'same',
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.findAll('[aria-current="step"]')).toHaveLength(1)
    expect(wrapper.get('p').text()).toBe('Étape 1 sur 2 · Première')
  })

  it('lets the consumer translate the landmark, the summary and the status texts', () => {
    const wrapper = mount(BaseStepper, {
      props: {
        steps,
        currentStepId: 'studies',
        label: 'Création du profil',
        summary: 'Plus que 3 étapes',
        statusLabels: { completed: 'Fait', current: 'En cours' },
      },
    })
    expect(wrapper.attributes('aria-label')).toBe('Création du profil')
    expect(wrapper.get('p').text()).toBe('Plus que 3 étapes')
    expect(statusTexts(wrapper)).toEqual([
      'Identité : Fait',
      'Études : En cours',
      'Compétences : À venir',
      'Récapitulatif : À venir',
    ])
  })

  it('keeps long labels whole and does not truncate them', () => {
    const label =
      'Informations complémentaires sur vos études, votre établissement et vos justificatifs'
    const wrapper = mount(BaseStepper, {
      props: {
        steps: [
          { id: 'long', label },
          { id: 'end', label: 'Fin' },
        ],
        currentStepId: 'long',
      },
    })
    expect(wrapper.get('p').text()).toBe(`Étape 1 sur 2 · ${label}`)
    expect(wrapper.get('li').text()).toContain(label)
  })
})
