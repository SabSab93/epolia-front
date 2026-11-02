<template>
  <AvatarRoot
    :key="source"
    class="base-avatar"
    :data-size="size"
    :data-shape="shape"
    :role="label ? 'img' : undefined"
    :aria-label="label || undefined"
    :aria-hidden="label ? undefined : true"
  >
    <AvatarImage v-if="source" :src="source" alt="" aria-hidden="true" class="base-avatar-image" />
    <AvatarFallback aria-hidden="true" class="base-avatar-fallback">{{ fallback }}</AvatarFallback>
  </AvatarRoot>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    src?: string
    alt: string
    initials?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
    shape?: 'circle' | 'rounded'
  }>(),
  { src: '', initials: '', size: 'md', shape: 'circle' },
)

// Keying the root by source resets Reka's context and discards stale image events.
const source = computed(() => props.src?.trim() || undefined)
const label = computed(() => props.alt.trim())
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
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    overflow: hidden;
    border-radius: 50%;
    background: var(--color-epolia-secondary-hover);
    color: var(--color-epolia-primary);
    font-family: var(--font-epolia-body);
    font-size: var(--text-epolia-body);
    font-weight: 600;
    line-height: 1;
    vertical-align: middle;
  }

  .base-avatar[data-size='sm'] {
    width: 2rem;
    height: 2rem;
    font-size: var(--text-epolia-body-small);
  }

  .base-avatar[data-size='lg'] {
    width: 4rem;
    height: 4rem;
    font-size: var(--text-epolia-title-md);
  }

  .base-avatar[data-size='xl'] {
    width: 6rem;
    height: 6rem;
    font-size: var(--text-epolia-title-lg);
  }

  .base-avatar[data-shape='rounded'] {
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

  @media (forced-colors: active) {
    .base-avatar {
      outline: 1px solid CanvasText;
      outline-offset: -1px;
      background: Canvas;
      color: CanvasText;
    }
  }
}
</style>
