import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        'epolia-title-lg',
        'epolia-title-md',
        'epolia-title-sm',
        'epolia-title-xs',
        'epolia-body',
        'epolia-body-small',
      ],
      spacing: [
        'epolia-2xs',
        'epolia-xs',
        'epolia-sm',
        'epolia-md',
        'epolia-lg',
        'epolia-xl',
        'epolia-2xl',
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
