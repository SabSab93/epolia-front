import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import meta, {
  Confirmation,
  InfoDialog,
  LongContent,
  WarningConfirmation,
  WithForm,
} from '@/shared/components/stories/BaseModal.stories'

enableAutoUnmount(afterEach)

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]')

async function openStory(render: ReturnType<typeof meta.render>) {
  const wrapper = mount(render, { attachTo: document.body })
  const opener = wrapper.get<HTMLButtonElement>('button')
  opener.element.focus()
  await opener.trigger('click')
  await flushPromises()
  return wrapper
}

describe('BaseModal stories', () => {
  it('opens the dialog story and closes it from its action', async () => {
    await openStory(meta.render({ ...meta.args }))
    const buttons = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('button'))
    expect(buttons.map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())).toEqual([
      'Fermer',
      'Mettre en pause',
      'Annuler',
    ])
    buttons[1]!.click()
    await flushPromises()
    expect(dialog()).toBeNull()
  })

  it('keeps long content in a scrolling area between title and actions', async () => {
    await openStory(LongContent.render({ ...meta.args, ...LongContent.args }))
    const body = dialog()!.querySelector('.base-modal-body')!
    expect(body.querySelectorAll('p')).toHaveLength(12)
    expect(dialog()!.querySelector('.base-modal-actions')!.textContent).toContain('J’ai compris')
  })

  it('submits the form story with the action button', async () => {
    await openStory(WithForm.render({ ...meta.args, ...WithForm.args }))
    const submit = dialog()!.querySelector<HTMLButtonElement>('button[type="submit"]')!
    expect(submit.getAttribute('form')).toBe('report-form')
    expect(dialog()!.querySelector('textarea')).not.toBeNull()
  })

  it('leaves the destructive action to the consumer in the confirmation story', async () => {
    const wrapper = await openStory(Confirmation.render({ ...meta.args, ...Confirmation.args }))
    expect(dialog()!.getAttribute('role')).toBe('alertdialog')
    const confirm = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Supprimer',
    )!
    confirm.click()
    await flushPromises()
    expect(dialog()).toBeNull()
    expect(wrapper.get('[role="status"]').text()).toBe('Document supprimé.')
    expect(document.activeElement).toBe(wrapper.get('button').element)
  })

  it.each([
    [Confirmation, 'Supprimer', 'bg-epolia-danger', 'alertdialog'],
    [WarningConfirmation, 'Annuler la mission', 'bg-epolia-warning', 'alertdialog'],
    [InfoDialog, 'Voir les étapes', 'bg-epolia-info', 'dialog'],
  ] as const)('shows the status action %#', async (story, label, color, role) => {
    await openStory(story.render({ ...meta.args, ...story.args }))
    expect(dialog()!.getAttribute('role')).toBe(role)
    const action = Array.from(dialog()!.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label,
    )!
    expect(action.classList).toContain(color)
  })
})
