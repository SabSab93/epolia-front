import type { SchoolAddressOptionTypes } from '@/domains/studies/models/types/schoolAddressOption.type'

// Grenoble-Alpes Métropole, EPCI 200040715 (geo.api.gouv.fr/epcis/200040715/communes).
const cityCodes = new Set(
  (
    '38057 38059 38068 38071 38111 38126 38150 38151 38158 38169 38170 38179 38185 ' +
    '38187 38188 38200 38229 38235 38252 38258 38271 38277 38279 38281 38309 38317 ' +
    '38325 38328 38364 38382 38388 38421 38423 38436 38445 38471 38472 38474 38478 ' +
    '38485 38486 38516 38524 38528 38529 38533 38540 38545 38562'
  ).split(' '),
)

export async function searchSchoolAddresses(term: string, signal: AbortSignal) {
  const params = new URLSearchParams({
    q: term,
    index: 'address',
    autocomplete: '1',
    depcode: '38',
    lon: '5.725',
    lat: '45.188',
    limit: '15',
  })
  const response = await fetch('https://data.geopf.fr/geocodage/search?' + params, {
    signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
  })
  if (!response.ok) throw new Error('Recherche d’adresses indisponible')
  const data = await response.json()
  if (!Array.isArray(data?.features)) throw new Error('Réponse d’adresses invalide')
  const options: SchoolAddressOptionTypes[] = []
  for (const feature of data.features) {
    const address = feature?.properties
    if (
      !address ||
      !cityCodes.has(address.citycode) ||
      !['street', 'housenumber'].includes(address.type) ||
      typeof address.name !== 'string' ||
      !address.name.trim() ||
      typeof address.city !== 'string' ||
      !address.city.trim() ||
      typeof address.postcode !== 'string' ||
      !/^\d{5}$/.test(address.postcode)
    )
      continue
    const locality = address.postcode + ' ' + address.city
    const label = address.name + ', ' + locality
    if (!options.some((option) => option.label === label))
      options.push({ street: address.name, locality, label })
    if (options.length === 5) break
  }
  return options
}
