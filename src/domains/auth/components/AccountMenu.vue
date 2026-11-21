<template>
  <PopoverRoot>
    <PopoverTrigger
      aria-label="Options du compte"
      class="inline-grid size-12 place-items-center rounded-epolia text-epolia-primary before:h-px before:w-4 before:bg-current before:[box-shadow:0_-4px_currentColor,0_4px_currentColor] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-epolia-focus"
    />
    <PopoverPortal>
      <PopoverContent
        aria-label="Options du compte"
        align="end"
        :side-offset="8"
        :collision-padding="16"
        class="z-10 flex w-72 flex-col gap-epolia-xs max-w-(--reka-popover-content-available-width) rounded-epolia border border-epolia-border bg-epolia-surface p-epolia-xs shadow-md"
      >
        <PopoverClose v-for="link in links" :key="link.label" as-child>
          <AuthLink :to="link.to" class="px-epolia-sm">{{ link.label }}</AuthLink>
        </PopoverClose>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
import { PopoverClose, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import type { AccountMenuLinkTypes } from '@/domains/auth/models/types/accountMenuLink.type'
import AuthLink from '@/domains/auth/components/AuthLink.vue'

defineProps<{ links: AccountMenuLinkTypes[] }>()
</script>
