import data from '@/domains/studies/data/onisep-titles.tsv?raw'

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

const entries = data
  .trimEnd()
  .split('\n')
  .map((line) => ({
    title: line.split('\t')[0]!,
    key: ' ' + normalize(line),
  }))

export function lookupTitles(query: string) {
  const words = normalize(query).split(' ').filter(Boolean)
  const matches = new Set<string>()
  if (!words.length) return []
  // Short searches such as MBA should match a word or acronym, never the middle of « embarqué ».
  const terms = words.map((word) => (word.length <= 3 ? ' ' + word : word))
  for (const entry of entries) {
    if (terms.every((word) => entry.key.includes(word))) matches.add(entry.title)
  }
  return [...matches]
}
