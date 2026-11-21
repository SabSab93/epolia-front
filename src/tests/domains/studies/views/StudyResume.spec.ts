import type { EducationSourceTypes } from '@/domains/studies/models/types/educationSource.type'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import StudentEducationForm from '@/domains/studies/components/StudentEducationForm.vue'
import type { IEducationDto } from '@/domains/studies/models/dtos/education.dto'
import * as api from '@/domains/studies/api/studiesApi'

vi.mock('@/domains/studies/api/studiesApi')

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-21T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

it.each<EducationSourceTypes>(['LEGACY', 'MANUAL', 'CATALOG'])(
  'keeps a published profile intact when continuing an unchanged %s declaration',
  async (source) => {
    vi.mocked(api.searchCampuses).mockResolvedValue([])
    vi.mocked(api.getCampusOffers).mockResolvedValue([])
    const education: IEducationDto = {
      id: 'education',
      title: 'Ma formation',
      school: 'Mon école',
      level: null,
      source,
      catalogOfferId: source === 'CATALOG' ? 'mba' : null,
      catalogCampusId: source === 'CATALOG' ? 'campus' : null,
      startDate: '2026-09-01',
      endDate: null,
      studyFieldId: null,
    }
    const wrapper = mount(StudentEducationForm, { props: { education } })
    try {
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(wrapper.emitted('saved')?.[0]).toEqual([education])
      expect(api.updateEducation).not.toHaveBeenCalled()
    } finally {
      wrapper.unmount()
    }
  },
)

it('shows year choices after the start date and saves only a complete end date', async () => {
  vi.mocked(api.updateEducation).mockClear()
  const education: IEducationDto = {
    id: 'november',
    title: 'MBA',
    school: 'Mon école',
    level: null,
    source: 'MANUAL',
    catalogOfferId: null,
    catalogCampusId: null,
    studyFieldId: null,
    startDate: null,
    endDate: null,
  }
  const wrapper = mount(StudentEducationForm, { props: { education } })
  try {
    const start = wrapper.get('input[type="date"]')
    const submit = () => wrapper.get('form').trigger('submit')
    const click = (label: string) =>
      wrapper
        .findAll('button')
        .find((button) => button.text() === label)!
        .trigger('click')
    await start.setValue('10000-09-01')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.text()).toContain('une année à quatre chiffres')
    await start.setValue('2026-11-22')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.text()).toContain('La formation doit avoir commencé')
    expect(api.updateEducation).not.toHaveBeenCalled()
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
    await start.setValue('2026-11-21')
    expect(
      wrapper
        .findAll<HTMLInputElement>('input[type="radio"]')
        .map((option) => option.element.value),
    ).toEqual(['2027', '2028', '2029'])
    const direct = wrapper.get('input[type="date"]:not([required])')
    await direct.setValue('2026-11-20')
    await submit()
    expect(api.updateEducation).not.toHaveBeenCalled()
    await direct.setValue('2026-11-21')
    vi.mocked(api.updateEducation).mockResolvedValue({
      ...education,
      startDate: '2026-11-21',
      endDate: '2026-11-21',
    })
    await submit()
    await flushPromises()
    expect(api.updateEducation).toHaveBeenCalledWith(
      education.id,
      expect.objectContaining({ endDate: '2026-11-21' }),
    )
    vi.mocked(api.updateEducation).mockClear()
    await click('Laisser la date à préciser')
    await start.setValue('')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
    await start!.setValue('2024-09-15')
    const radios = wrapper.findAll<HTMLInputElement>('input[type="radio"]')
    expect(radios.map((radio) => radio.element.value)).toEqual(['2026', '2027', '2028'])
    expect(radios.every((radio) => !radio.element.checked)).toBe(true)
    await radios[1]!.setValue()
    const end = wrapper.get('input[type="date"][min]')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(false)
    expect(end.attributes('required')).toBeUndefined()
    expect(end.attributes('max')).toBe('2027-12-31')
    vi.mocked(api.updateEducation).mockResolvedValue({ ...education, startDate: '2024-09-15' })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.updateEducation).toHaveBeenLastCalledWith(
      'november',
      expect.objectContaining({
        startDate: '2024-09-15',
        endDate: null,
      }),
    )
    await radios[2]!.setValue()
    const reopened = wrapper.get('input[type="date"][min]')
    expect(reopened.attributes('min')).toBe('2028-01-01')
    expect(reopened.attributes('max')).toBeUndefined()
    await reopened.setValue('30000-11-12')
    expect(wrapper.get<HTMLButtonElement>('button[type="submit"]').element.disabled).toBe(true)
    expect(wrapper.text()).toContain('une année à quatre chiffres')
    await reopened.setValue('2030-11-12')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(api.updateEducation).toHaveBeenLastCalledWith(
      'november',
      expect.objectContaining({
        startDate: '2024-09-15',
        endDate: '2030-11-12',
      }),
    )
    await radios[1]!.setValue()
    await wrapper.get('form').trigger('submit')
    expect(api.updateEducation).toHaveBeenCalledTimes(2)
    await radios[0]!.setValue()
    expect(reopened.attributes('min')).toBe('2026-11-21')
    expect(reopened.attributes('max')).toBe('2026-12-31')
    expect((reopened.element as HTMLInputElement).value).toBe('2030-11-12')
  } finally {
    wrapper.unmount()
  }
})
