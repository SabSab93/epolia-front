import { describe, expect, it } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('Epolia spacing overrides', () => {
  it.each([
    ['gap-epolia-xs', 'gap-epolia-md'],
    ['px-epolia-md', 'px-epolia-lg'],
    ['mr-epolia-xs', 'mr-epolia-sm'],
    ['gap-2', 'gap-epolia-xs'],
  ])('lets %s be overridden by %s', (base, override) => {
    expect(cn(base, override)).toBe(override)
  })

  it('keeps independent padding directions and replaces them with a global padding', () => {
    expect(cn('py-epolia-sm', 'px-epolia-md')).toBe('py-epolia-sm px-epolia-md')
    expect(cn('py-epolia-sm px-epolia-md', 'p-epolia-lg')).toBe('p-epolia-lg')
  })
})

describe('Epolia typography overrides', () => {
  it('replaces a text role without removing its independent color', () => {
    expect(cn('text-epolia-body text-epolia-text', 'text-epolia-body-small')).toBe(
      'text-epolia-text text-epolia-body-small',
    )
  })

  it('replaces a surface without affecting its text role', () => {
    expect(cn('bg-epolia-page text-epolia-body', 'bg-epolia-surface')).toBe(
      'text-epolia-body bg-epolia-surface',
    )
  })
})
