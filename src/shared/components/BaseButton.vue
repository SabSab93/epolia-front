<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    type: 'button',
  },
)
</script>

<template>
  <button
    :type="type"
    class="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition active:scale-[0.98]"
  >
    {{ label }}
  </button>
</template>
