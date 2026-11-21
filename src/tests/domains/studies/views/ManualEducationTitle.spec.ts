import { defineComponent, ref } from 'vue'
import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import ManualEducationTitle from '@/domains/studies/components/ManualEducationTitle.vue'
import { lookupTitles } from '@/domains/studies/api/onisepTitleIndex'

enableAutoUnmount(afterEach)
afterEach(() => vi.unstubAllGlobals())

function setup(initial = '') {
  const title = ref(initial)
  const wrapper = mount(
    defineComponent({
      components: { ManualEducationTitle },
      setup: () => ({ title }),
      template: '<ManualEducationTitle v-model="title" />',
    }),
    { attachTo: document.body },
  )
  const field = () => wrapper.get<HTMLInputElement>('input')
  const click = (label: string) =>
    wrapper
      .findAll('button')
      .find((button) => button.text() === label)!
      .trigger('click')
  return { wrapper, title, field, click }
}

it('finds local titles beyond the daily quota and exposes all matches as the list scrolls', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('hors ligne'))
  vi.stubGlobal('fetch', fetch)
  const { wrapper, title, field } = setup()
  await field().setValue('i')
  expect(wrapper.get('p[role="status"]').text()).toBe('Saisissez au moins deux caractères.')
  for (const query of ['full-stack', 'sio', 'biologie', 'design', 'architecture', 'informatique']) {
    await field().setValue(query)
    await vi.waitFor(() => expect(wrapper.findAll('[role="option"]').length).toBeGreaterThan(0))
  }
  expect(title.value).toBe('')
  const results = lookupTitles('informatique')
  expect(results.length).toBeGreaterThan(25)
  const options = () => wrapper.findAll('[role="option"]')
  expect(options()).toHaveLength(25)
  const list = wrapper.get('[role="listbox"]')
  // jsdom does not lay out the scroll container.
  Object.defineProperties(list.element, {
    scrollTop: { value: 500 },
    clientHeight: { value: 250 },
    scrollHeight: { value: 750 },
  })
  for (let count = 25; count < results.length; count += 25) await list.trigger('scroll')
  expect(options().map((row) => row.text())).toEqual(results)
  await options().at(-1)!.trigger('click')
  expect(title.value).toBe(results.at(-1))
  expect(field().attributes('aria-expanded')).toBe('false')
  expect(fetch).not.toHaveBeenCalled()
})

it('matches acronyms and normalized titles', async () => {
  expect(
    lookupTitles('BTS SIO').some((title) =>
      title.includes('services informatiques aux organisations'),
    ),
  ).toBe(true)
  const mbas = lookupTitles('mba')
  expect(mbas.some((title) => title.startsWith('MBA '))).toBe(true)
  expect(mbas.some((title) => title.startsWith('Master of Business Administration'))).toBe(true)
  expect(mbas.some((title) => title.includes('embarqu'))).toBe(false)
  expect(lookupTitles('FULL-STACK')).toEqual(lookupTitles('full stack'))
})

it('clears only the title and focuses the new field in both entry modes', async () => {
  const { wrapper, field, click, title } = setup('Formation enregistrée')
  await field().setValue('Ma formation hors catalogue')
  await vi.waitFor(() =>
    expect(wrapper.get('[role="status"]').text()).toBe('Aucune formation trouvée.'),
  )
  await click('Saisir le nom de ma formation')
  expect(title.value).toBe('')
  expect(field().element.value).toBe('')
  expect(document.activeElement).toBe(field().element)
  await field().setValue('Mon intitulé modifié')
  await click('Choisir une formation dans la liste')
  expect(title.value).toBe('')
  expect(field().element.value).toBe('')
  expect(document.activeElement).toBe(field().element)
})

it('explains why typed text still needs a selection when closing the suggestions', async () => {
  const { wrapper, title, field } = setup()
  await field().setValue('MBA')
  await vi.waitFor(() => expect(wrapper.find('[role="option"]').exists()).toBe(true))
  await field().trigger('keydown', { key: 'Escape' })
  await vi.waitFor(() => expect(field().attributes('aria-expanded')).toBe('false'))
  expect(title.value).toBe('')
  expect(wrapper.get('[role="status"]').text()).toBe('Sélectionnez une formation dans la liste.')
})
