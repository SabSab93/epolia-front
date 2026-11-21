import { flushPromises, mount } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import StudentEducationForm from '@/domains/studies/components/StudentEducationForm.vue'
import type { Education } from '@/domains/studies/models/education'
import * as api from '@/domains/studies/api/studiesApi'

vi.mock('@/domains/studies/api/studiesApi')

it.each<Education['source']>(['LEGACY', 'MANUAL', 'CATALOG'])(
  'keeps a published profile intact when continuing an unchanged %s declaration',
  async (source) => {
    vi.mocked(api.getOfferCandidates).mockResolvedValue([])
    const education: Education = {
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
