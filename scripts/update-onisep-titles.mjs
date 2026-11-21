// Source Onisep, « Idéo-Formations initiales en France », licence ODbL 1.0.
import { readFile, writeFile } from 'node:fs/promises'
import { argv } from 'node:process'
import { URL } from 'node:url'

const source = 'https://data.onisep.fr/api/v1/downloads/5fa591127f501/5fa591127f501.json'
const target = new URL('../src/domains/studies/data/onisep-titles.tsv', import.meta.url)

async function loadExport() {
  if (argv[2]) return JSON.parse(await readFile(argv[2], 'utf8'))
  const response = await globalThis.fetch(source)
  if (!response.ok) throw new Error('Export Onisep indisponible : HTTP ' + response.status)
  return response.json()
}

const rows = new Set()
for (const record of await loadExport()) {
  const title = record.libelle_formation_principal.replace(/\s+/g, ' ').trim()
  if (!title || title.length > 150) continue
  const acronym = (record.sigle_formation ?? '').replace(/\s+/g, ' ').trim()
  rows.add(acronym ? title + '\t' + acronym : title)
}
if (!rows.size) throw new Error('Export Onisep vide')
await writeFile(target, [...rows].sort().join('\n') + '\n')
