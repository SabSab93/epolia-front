import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaseAvatar from '@/shared/components/BaseAvatar.vue'
import BaseProfilePhotoPicker from '@/shared/components/BaseProfilePhotoPicker.vue'

const createObjectURL = vi.fn<(file: Blob) => string>()
const revokeObjectURL = vi.fn<(url: string) => void>()
const decode = vi.fn<() => Promise<void>>()

enableAutoUnmount(afterEach)

beforeEach(() => {
  let nextUrl = 0
  createObjectURL.mockReset().mockImplementation(() => `blob:photo-${++nextUrl}`)
  revokeObjectURL.mockReset()
  decode.mockReset().mockResolvedValue(undefined)
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = createObjectURL
      static revokeObjectURL = revokeObjectURL
    },
  )
  vi.stubGlobal(
    'Image',
    class extends EventTarget {
      src = ''
      decode = decode
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

function renderPicker(modelValue: File | null = null) {
  const wrapper = mount(BaseProfilePhotoPicker, {
    attachTo: document.body,
    props: {
      modelValue,
      acceptedTypes: ['image/png'],
      maxSizeBytes: 1_000_000,
      'onUpdate:modelValue': (file: File | null) => void wrapper.setProps({ modelValue: file }),
    },
  })
  const input = wrapper.get<HTMLInputElement>('input[type="file"]')

  async function selectFile(file?: File) {
    Object.defineProperty(input.element, 'files', { configurable: true, value: file ? [file] : [] })
    await input.trigger('change')
    await flushPromises()
  }

  return { wrapper, input, selectFile }
}

function photo(name: string) {
  return new File(['preview'], name, { type: 'image/png' })
}

describe('BaseProfilePhotoPicker', () => {
  it('opens the local chooser from a button and preserves the preview on cancellation', async () => {
    const { wrapper, input, selectFile } = renderPicker(photo('profil.png'))
    const click = vi.spyOn(input.element, 'click')
    await wrapper.get('button').trigger('click')
    expect(click).toHaveBeenCalledOnce()
    expect(input.attributes('accept')).toBe('image/png')
    await selectFile()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.getComponent(BaseAvatar).props('src')).toBe('blob:photo-1')
    expect(revokeObjectURL).not.toHaveBeenCalled()
  })

  it('keeps the previous preview for a wrong type, oversized or unreadable image', async () => {
    const { wrapper, selectFile } = renderPicker(photo('profil.png'))
    const error = () => wrapper.get('[role="alert"]').text()
    await selectFile(new File(['a'], 'notes.txt', { type: 'text/plain' }))
    expect(error()).toBe('Choisissez une image au format PNG.')
    await selectFile(new File([new Uint8Array(1_000_001)], 'grand.png', { type: 'image/png' }))
    expect(error()).toBe('Choisissez une image de 1 Mo maximum.')
    decode.mockRejectedValueOnce(new Error('Invalid image'))
    await selectFile(photo('illisible.png'))
    expect(error()).toBe('Impossible d’ouvrir cette image. Choisissez une autre photo.')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.getComponent(BaseAvatar).props('src')).toBe('blob:photo-1')
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:photo-2')
  })

  it('releases URLs after replacement, removal and unmount, and restores focus after removal', async () => {
    const { wrapper, selectFile } = renderPicker()
    const first = photo('premiere.png')
    const second = photo('seconde.png')
    await selectFile(first)
    expect(wrapper.emitted('update:modelValue')).toEqual([[first]])
    const firstPreview = wrapper.getComponent(BaseAvatar).props('src')
    await selectFile(second)
    expect(revokeObjectURL).toHaveBeenCalledWith(firstPreview)
    const secondPreview = wrapper.getComponent(BaseAvatar).props('src')
    await wrapper.get('button:last-child').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[first], [second], [null]])
    expect(wrapper.getComponent(BaseAvatar).props('src')).toBe('')
    expect(revokeObjectURL).toHaveBeenCalledWith(secondPreview)
    expect(wrapper.get('button').element).toHaveFocus()
    await selectFile(second)
    const remainingPreview = wrapper.getComponent(BaseAvatar).props('src')
    wrapper.unmount()
    expect(revokeObjectURL).toHaveBeenCalledWith(remainingPreview)
  })

  it.each([
    [{ acceptedTypes: ['image/jpeg'] }, 'Choisissez une image au format JPEG.'],
    [{ maxSizeBytes: 1 }, 'Choisissez une image de 0,000001 Mo maximum.'],
  ] as const)('revalidates constraints changed during decoding (%j)', async (limits, message) => {
    const { wrapper, selectFile } = renderPicker(photo('profil.png'))
    let finish!: () => void
    decode.mockImplementationOnce(() => new Promise<void>((resolve) => (finish = resolve)))
    await selectFile(photo('nouvelle.png'))
    expect(wrapper.get('[role="status"]').text()).toBe('Préparation de l’aperçu…')

    await wrapper.setProps(limits)
    finish()
    await flushPromises()

    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.get('[role="alert"]').text()).toBe(message)
    expect(wrapper.get('[role="status"]').text()).toContain('profil.png')
    expect(wrapper.getComponent(BaseAvatar).props('src')).toBe('blob:photo-1')
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:photo-2')
  })

  it('ignores an earlier decode that completes after a newer selection', async () => {
    const { wrapper, selectFile } = renderPicker()
    let finishFirst!: () => void
    decode.mockImplementationOnce(() => new Promise<void>((resolve) => (finishFirst = resolve)))
    await selectFile(photo('lente.png'))
    const second = photo('recente.png')
    await selectFile(second)
    finishFirst()
    await flushPromises()
    expect(wrapper.emitted('update:modelValue')).toEqual([[second]])
    expect(wrapper.get('[role="status"]').text()).toContain('recente.png')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:photo-1')
  })
})
