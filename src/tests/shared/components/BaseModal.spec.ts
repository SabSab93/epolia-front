import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, ref } from 'vue'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseModal from '@/shared/components/BaseModal.vue'

enableAutoUnmount(afterEach)

type ModalProps = InstanceType<typeof BaseModal>['$props']

// A parent with an opener button, like a real screen.
function mountWithOpener(props: Partial<ModalProps> = {}) {
  const open = ref(false)
  const Parent = defineComponent({
    setup: () => () => [
      h('button', { id: 'opener', onClick: () => (open.value = true) }, 'Ouvrir'),
      h(
        BaseModal,
        {
          title: 'Me mettre en pause',
          description: 'Votre profil n’apparaîtra plus dans les recherches.',
          ...props,
          open: open.value,
          'onUpdate:open': (value: boolean) => (open.value = value),
        },
        {
          default: () => h('p', 'Contenu de la modale'),
          actions: () => h(BaseButton, { label: 'Mettre en pause' }),
        },
      ),
    ],
  })
  const wrapper = mount(Parent, { attachTo: document.body })
  async function openModal() {
    const opener = wrapper.get<HTMLButtonElement>('#opener')
    opener.element.focus()
    await opener.trigger('click')
    await flushPromises()
  }
  return { wrapper, open, openModal }
}

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]')
// Reka listens for outside taps only after a timeout, to ignore the tap that opened it.
async function tapVeil() {
  await new Promise((resolve) => setTimeout(resolve, 0))
  document
    .querySelector('.base-modal-overlay')!
    .dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
  await flushPromises()
}
const pressEscape = () =>
  document.activeElement!.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  )

describe('BaseModal', () => {
  it('renders nothing while closed', () => {
    mountWithOpener()
    expect(dialog()).toBeNull()
  })

  it('opens as a named dialog in a portal with the focus on its title', async () => {
    const { wrapper, openModal } = mountWithOpener()
    await openModal()
    const modal = dialog()!
    expect(wrapper.element.contains(modal)).toBe(false)
    expect(modal.getAttribute('role')).toBe('dialog')
    const title = modal.querySelector('h2')!
    expect(title.textContent?.trim()).toBe('Me mettre en pause')
    expect(modal.getAttribute('aria-labelledby')).toBe(title.id)
    expect(document.getElementById(modal.getAttribute('aria-describedby')!)?.textContent).toContain(
      'Votre profil',
    )
    expect(document.activeElement).toBe(title)
    expect(title.getAttribute('tabindex')).toBe('-1')
    expect(modal.textContent).toContain('Contenu de la modale')
  })

  it('closes with the × button and gives the focus back to the opener', async () => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    const close = dialog()!.querySelector<HTMLButtonElement>('button[aria-label="Fermer"]')!
    expect(close.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
    close.click()
    await flushPromises()
    expect(open.value).toBe(false)
    expect(dialog()).toBeNull()
    expect(document.activeElement?.id).toBe('opener')
  })

  it('closes with Escape', async () => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    pressEscape()
    await flushPromises()
    expect(open.value).toBe(false)
  })

  it('does not point to a missing description', async () => {
    const { openModal } = mountWithOpener({ description: undefined })
    await openModal()
    expect(dialog()!.hasAttribute('aria-describedby')).toBe(false)
  })

  it('closes when the veil is tapped', async () => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    await tapVeil()
    expect(open.value).toBe(false)
  })

  it('adds a cancel button only when asked in a regular dialog', async () => {
    const { open, openModal } = mountWithOpener({ cancelLabel: 'Plus tard' })
    await openModal()
    const buttons = Array.from(dialog()!.querySelectorAll('.base-modal-actions button'))
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Mettre en pause', 'Plus tard'])
    ;(buttons[1] as HTMLButtonElement).click()
    await flushPromises()
    expect(open.value).toBe(false)
  })

  it('runs a confirmation without ×, handle or veil closing, focusing Cancel first', async () => {
    const { open, openModal } = mountWithOpener({ confirmation: true })
    await openModal()
    const modal = dialog()!
    expect(modal.getAttribute('role')).toBe('alertdialog')
    expect(modal.querySelector('button[aria-label="Fermer"]')).toBeNull()
    expect(modal.querySelector('.base-modal-handle')).toBeNull()
    const cancel = Array.from(modal.querySelectorAll('button')).at(-1)!
    expect(cancel.textContent?.trim()).toBe('Annuler')
    expect(document.activeElement).toBe(cancel)
    await tapVeil()
    expect(open.value).toBe(true)
    pressEscape()
    await flushPromises()
    expect(open.value).toBe(false)
    expect(document.activeElement?.id).toBe('opener')
  })

  it('forgets a swipe interrupted by another way of closing', async () => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    const handle = dialog()!.querySelector<HTMLElement>('.base-modal-handle')!
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }))
    pressEscape()
    await flushPromises()
    expect(open.value).toBe(false)
    open.value = true
    await flushPromises()
    const reopened = dialog()!.querySelector<HTMLElement>('.base-modal-handle')!
    expect(reopened.classList.contains('is-dragging')).toBe(false)
    reopened.dispatchEvent(new MouseEvent('pointermove', { clientY: 300, bubbles: true }))
    await flushPromises()
    expect(dialog()!.style.transform).toBe('')
  })

  it('slides back when the swipe is cancelled by the system', async () => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    const handle = dialog()!.querySelector<HTMLElement>('.base-modal-handle')!
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }))
    handle.dispatchEvent(new MouseEvent('pointermove', { clientY: 300, bubbles: true }))
    handle.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }))
    await flushPromises()
    expect(open.value).toBe(true)
    expect(dialog()!.style.transform).toBe('')
  })

  it('keeps Cancel in a confirmation even with an empty label', async () => {
    const { openModal } = mountWithOpener({ confirmation: true, cancelLabel: '' })
    await openModal()
    const cancel = Array.from(dialog()!.querySelectorAll('button')).at(-1)!
    expect(cancel.textContent?.trim()).toBe('Annuler')
    expect(document.activeElement).toBe(cancel)
  })

  it.each([
    [40, true],
    [120, false],
  ])('after a %ipx swipe on the handle, stays open: %s', async (distance, staysOpen) => {
    const { open, openModal } = mountWithOpener()
    await openModal()
    const handle = dialog()!.querySelector<HTMLElement>('.base-modal-handle')!
    expect(handle.getAttribute('aria-hidden')).toBe('true')
    handle.dispatchEvent(new MouseEvent('pointerdown', { clientY: 100, bubbles: true }))
    handle.dispatchEvent(new MouseEvent('pointermove', { clientY: 100 + distance, bubbles: true }))
    await flushPromises()
    expect(dialog()!.style.transform).toBe(`translateY(${distance}px)`)
    handle.dispatchEvent(new MouseEvent('pointerup', { clientY: 100 + distance, bubbles: true }))
    await flushPromises()
    expect(open.value).toBe(staysOpen)
    if (staysOpen) expect(dialog()!.style.transform).toBe('')
  })
})
