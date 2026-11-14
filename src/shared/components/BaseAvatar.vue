<template>
  <span class="base-avatar" :data-size="size" :data-shape="shape">
    <AvatarRoot
      :key="source"
      class="base-avatar-portrait"
      :role="label ? 'img' : undefined"
      :aria-label="label || undefined"
      :aria-hidden="label ? undefined : true"
    >
      <AvatarImage
        v-if="source"
        :src="source"
        alt=""
        aria-hidden="true"
        class="base-avatar-image"
      />
      <AvatarFallback aria-hidden="true" class="base-avatar-fallback">{{
        fallback
      }}</AvatarFallback>
    </AvatarRoot>
    <span
      v-if="$slots.badge"
      class="base-avatar-badge"
      :role="badgeLabel ? 'img' : undefined"
      :aria-label="badgeLabel"
      :aria-hidden="badgeLabel ? undefined : true"
    >
      <slot name="badge" />
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    src?: string
    alt: string
    initials?: string
    badgeLabel?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    shape?: 'circle' | 'rounded'
  }>(),
  { src: '', initials: '', badgeLabel: '', size: 'md', shape: 'circle' },
)

// Keying the root by source resets Reka's context and discards stale image events.
const source = computed(() => props.src?.trim() || undefined)
const label = computed(() => props.alt.trim())
const badgeLabel = computed(() => props.badgeLabel?.trim() || undefined)
const fallback = computed(() => {
  const segments = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  return (
    Array.from(segments.segment(props.initials?.trim() || ''), (part) => part.segment)
      .slice(0, 2)
      .join('') || '?'
  )
})
</script>

<style scoped>
@layer components {
  .base-avatar {
    --avatar-badge-size: 1.125rem;
    --avatar-badge-icon-size: 0.625rem;
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    font-size: var(--text-epolia-body);
    vertical-align: middle;
  }

  .base-avatar-portrait {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: 50%;
    background: var(--color-epolia-secondary-hover);
    color: var(--color-epolia-primary);
    font-family: var(--font-epolia-body);
    font-weight: 600;
    line-height: 1;
  }

  .base-avatar[data-size='sm'] {
    --avatar-badge-size: 0.875rem;
    --avatar-badge-icon-size: 0.5rem;
    width: 2rem;
    height: 2rem;
    font-size: var(--text-epolia-body-small);
  }

  .base-avatar[data-size='lg'] {
    --avatar-badge-size: 1.375rem;
    --avatar-badge-icon-size: 0.75rem;
    width: 4rem;
    height: 4rem;
    font-size: var(--text-epolia-title-md);
  }

  .base-avatar[data-size='xl'] {
    --avatar-badge-size: 1.5rem;
    --avatar-badge-icon-size: 0.875rem;
    width: 6rem;
    height: 6rem;
    font-size: var(--text-epolia-title-lg);
  }

  .base-avatar[data-shape='rounded'] .base-avatar-portrait {
    border-radius: var(--radius);
  }

  .base-avatar-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .base-avatar-fallback {
    white-space: nowrap;
  }

  .base-avatar-badge {
    position: absolute;
    inset-inline-end: 0;
    inset-block-end: 0;
    display: grid;
    place-items: center;
    width: var(--avatar-badge-size);
    height: var(--avatar-badge-size);
    border: 2px solid var(--color-epolia-surface);
    border-radius: 50%;
    background: var(--color-epolia-primary);
    color: var(--color-epolia-primary-text);
  }

  .base-avatar-badge :deep(svg) {
    width: var(--avatar-badge-icon-size);
    height: var(--avatar-badge-icon-size);
  }

  @media (forced-colors: active) {
    .base-avatar-portrait {
      outline: 1px solid CanvasText;
      outline-offset: -1px;
      background: Canvas;
      color: CanvasText;
    }

    .base-avatar-badge {
      border-color: CanvasText;
      background: Canvas;
      color: CanvasText;
    }
  }
}
</style>
