<template>
  <!-- A confirmation uses Reka AlertDialog: role, veil and focus on Cancel are handled by Reka. -->
  <component :is="parts.Root" v-model:open="open">
    <component :is="parts.Portal">
      <component
        :is="parts.Overlay"
        class="base-modal-overlay data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in motion-reduce:animate-none"
      />
      <component
        :is="parts.Content"
        v-bind="description ? {} : { 'aria-describedby': undefined }"
        class="base-modal data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom motion-reduce:animate-none"
        :style="dragOffset > 0 ? { transform: `translateY(${dragOffset}px)` } : undefined"
        @open-auto-focus="focusTitle"
        @close-auto-focus="restoreFocus"
      >
        <!-- Swipe down on the handle to close. The × button and Escape do the same. -->
        <div
          v-if="!confirmation"
          aria-hidden="true"
          class="base-modal-handle"
          :class="{ 'is-dragging': dragStartY !== null }"
          @pointerdown="startDrag"
          @pointermove="moveDrag"
          @pointerup="endDrag"
          @pointercancel="cancelDrag"
        >
          <span class="base-modal-handle-bar" />
        </div>

        <div class="base-modal-header">
          <div class="base-modal-heading">
            <component :is="parts.Title" as-child>
              <BaseTitle ref="title" level="h2" tabindex="-1" class="base-modal-title">
                {{ title }}
              </BaseTitle>
            </component>
            <component :is="parts.Description" v-if="description" class="base-modal-description">
              {{ description }}
            </component>
          </div>
          <DialogClose v-if="!confirmation" aria-label="Fermer" class="base-modal-close">
            <BaseIcon :icon="IconClose" />
          </DialogClose>
        </div>

        <div v-if="$slots.default" class="base-modal-body">
          <slot />
        </div>

        <div v-if="$slots.actions || cancelText" class="base-modal-actions">
          <slot name="actions" />
          <component :is="parts.Cancel" v-if="cancelText" as-child>
            <BaseButton :label="cancelText" variant="tertiary" />
          </component>
        </div>
      </component>
    </component>
  </component>
</template>

<script setup lang="ts">
import {
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogRoot,
  AlertDialogTitle,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { computed, ref, useTemplateRef, watch, type VNodeChild } from 'vue'
import IconClose from '~icons/material-symbols/close'
import BaseButton from '@/shared/components/BaseButton.vue'
import BaseIcon from '@/shared/components/BaseIcon.vue'
import BaseTitle from '@/shared/components/BaseTitle.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description?: string
    /** Confirmation: no ×, no swipe, tapping the veil does nothing, focus starts on Cancel. */
    confirmation?: boolean
    /** Adds a tertiary button that closes the modal. Defaults to "Annuler" for a confirmation. */
    cancelLabel?: string
  }>(),
  { description: undefined, confirmation: false, cancelLabel: undefined },
)

const open = defineModel<boolean>('open', { default: false })

defineSlots<{ default?(): VNodeChild; actions?(): VNodeChild }>()

// A confirmation always keeps a way out, even with an empty label.
const cancelText = computed(() => props.cancelLabel || (props.confirmation ? 'Annuler' : ''))

const parts = computed(() =>
  props.confirmation
    ? {
        Root: AlertDialogRoot,
        Portal: AlertDialogPortal,
        Overlay: AlertDialogOverlay,
        Content: AlertDialogContent,
        Title: AlertDialogTitle,
        Description: AlertDialogDescription,
        Cancel: AlertDialogCancel,
      }
    : {
        Root: DialogRoot,
        Portal: DialogPortal,
        Overlay: DialogOverlay,
        Content: DialogContent,
        Title: DialogTitle,
        Description: DialogDescription,
        Cancel: DialogClose,
      },
)

const titleRef = useTemplateRef<InstanceType<typeof BaseTitle>>('title')

// Swipe to close: past this distance the modal closes, otherwise it slides back.
const CLOSE_DISTANCE_PX = 96
const dragOffset = ref(0)
const dragStartY = ref<number | null>(null)

// Reka only returns focus to a DialogTrigger: remember what had focus before opening.
let previousFocus: globalThis.HTMLElement | null = null
watch(
  open,
  (isOpen) => {
    if (!isOpen) return
    previousFocus =
      globalThis.document.activeElement instanceof globalThis.HTMLElement
        ? globalThis.document.activeElement
        : null
    dragOffset.value = 0
    dragStartY.value = null
  },
  { immediate: true },
)

// A regular dialog starts on its title so screen readers read it first.
// A confirmation keeps Reka's default: focus on Cancel.
function focusTitle(event: globalThis.Event) {
  if (props.confirmation) return
  event.preventDefault()
  ;(titleRef.value?.$el as globalThis.HTMLElement | undefined)?.focus()
}

function restoreFocus(event: globalThis.Event) {
  event.preventDefault()
  if (previousFocus?.isConnected) previousFocus.focus()
  previousFocus = null
}

function startDrag(event: globalThis.PointerEvent) {
  dragStartY.value = event.clientY
  ;(event.currentTarget as globalThis.HTMLElement).setPointerCapture?.(event.pointerId)
}

function moveDrag(event: globalThis.PointerEvent) {
  if (dragStartY.value === null) return
  dragOffset.value = Math.max(0, event.clientY - dragStartY.value)
}

function endDrag() {
  if (dragStartY.value === null) return
  dragStartY.value = null
  if (dragOffset.value >= CLOSE_DISTANCE_PX) open.value = false
  else dragOffset.value = 0
}

function cancelDrag() {
  dragStartY.value = null
  dragOffset.value = 0
}
</script>

<style scoped>
@layer components {
  .base-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 50;
    background-color: var(--color-epolia-overlay);
  }

  .base-modal {
    position: fixed;
    inset-inline: 0;
    bottom: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-md);
    max-height: calc(100dvh - env(safe-area-inset-top, 0px) - var(--spacing-epolia-xl));
    padding: 0 var(--spacing-epolia-md)
      calc(var(--spacing-epolia-md) + env(safe-area-inset-bottom, 0px));
    border-radius: calc(var(--radius-epolia) * 2) calc(var(--radius-epolia) * 2) 0 0;
    background-color: var(--color-epolia-page);
    color: var(--color-epolia-text);
    outline: none;
    transition: transform 150ms ease-out;
  }

  .base-modal:has(.is-dragging) {
    transition: none;
  }

  .base-modal-handle {
    display: flex;
    justify-content: center;
    align-items: center;
    /* 48 px tall swipe zone, as for any touch target. */
    min-height: 3rem;
    margin-bottom: calc(var(--spacing-epolia-md) * -1);
    cursor: grab;
    touch-action: none;
  }

  .base-modal-handle-bar {
    width: 2.5rem;
    height: 0.25rem;
    border-radius: 9999px;
    background-color: var(--color-epolia-border);
  }

  .base-modal-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-epolia-xs);
    padding-top: var(--spacing-epolia-md);
  }

  .base-modal-handle + .base-modal-header {
    padding-top: 0;
  }

  .base-modal-heading {
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: var(--spacing-epolia-2xs);
  }

  .base-modal-title:focus {
    outline: none;
  }

  .base-modal-title:focus-visible {
    border-radius: var(--radius-epolia);
    box-shadow:
      0 0 0 2px var(--color-epolia-page),
      0 0 0 4px var(--color-epolia-focus);
  }

  .base-modal-description {
    font-size: var(--text-epolia-body-small);
    line-height: var(--text-epolia-body-small--line-height);
    color: var(--color-epolia-text-secondary);
    overflow-wrap: break-word;
  }

  .base-modal-close {
    display: inline-flex;
    width: 3rem;
    height: 3rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    margin: calc(var(--spacing-epolia-sm) * -1) calc(var(--spacing-epolia-sm) * -1) 0 0;
    border-radius: var(--radius-epolia);
    color: var(--color-epolia-text);
    touch-action: manipulation;
  }

  .base-modal-close:focus-visible {
    outline: 2px solid transparent;
    box-shadow:
      0 0 0 2px var(--color-epolia-page),
      0 0 0 4px var(--color-epolia-focus);
  }

  .base-modal-body {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    font-size: var(--text-epolia-body);
    line-height: var(--text-epolia-body--line-height);
  }

  .base-modal-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-epolia-xs);
  }

  .base-modal-actions > :deep(*) {
    width: 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    .base-modal {
      transition: none;
    }
  }
}
</style>
