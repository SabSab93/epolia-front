<template>
  <span
    aria-hidden="true"
    class="relative block max-w-full overflow-hidden rounded-epolia bg-epolia-skeleton before:absolute before:inset-0 before:-translate-x-full before:bg-linear-to-r before:from-transparent before:via-epolia-skeleton-highlight before:to-transparent motion-safe:before:animate-epolia-skeleton"
    :class="[widthClasses[width], heightClasses[height]]"
  />
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const widthClasses = {
  xs: 'w-1/4',
  sm: 'w-1/2',
  md: 'w-3/4',
  lg: 'w-full',
}

const heightClasses = {
  thin: 'h-epolia-skeleton-thin',
  normal: 'h-epolia-skeleton-normal',
  thick: 'h-epolia-skeleton-thick',
}

withDefaults(
  defineProps<{
    width?: keyof typeof widthClasses
    height?: keyof typeof heightClasses
  }>(),
  { width: 'md', height: 'normal' },
)
</script>
