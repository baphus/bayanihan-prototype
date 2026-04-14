export type PsgcOption = {
  code: string
  name: string
}

import {
  STATIC_BARANGAYS,
  STATIC_MUNICIPALITIES,
  STATIC_PROVINCES,
  STATIC_REGIONS,
  type StaticAddressOption,
} from '../data/psgcStaticData'

function isRegionCode(code: string): boolean {
  return /^\d{2}0{8}$/.test(code)
}

function sortByName(items: StaticAddressOption[]): PsgcOption[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}

export function getPsgcRegions(signal?: AbortSignal): Promise<PsgcOption[]> {
  void signal
  return Promise.resolve(sortByName(STATIC_REGIONS))
}

export function getPsgcProvinces(regionCode: string, signal?: AbortSignal): Promise<PsgcOption[]> {
  void signal
  const regionPrefix = regionCode.slice(0, 2)
  const matches = STATIC_PROVINCES.filter((item) => item.code.slice(0, 2) === regionPrefix)
  return Promise.resolve(sortByName(matches))
}

export function getPsgcMunicipalities(parentCode: string, signal?: AbortSignal): Promise<PsgcOption[]> {
  void signal

  const matches = isRegionCode(parentCode)
    ? STATIC_MUNICIPALITIES.filter((item) => item.code.slice(0, 2) === parentCode.slice(0, 2))
    : STATIC_MUNICIPALITIES.filter((item) => item.code.slice(0, 5) === parentCode.slice(0, 5))

  return Promise.resolve(sortByName(matches))
}

export function getPsgcBarangays(municipalityCode: string, signal?: AbortSignal): Promise<PsgcOption[]> {
  void signal
  // Barangays are grouped by city/municipality code using the first 6 digits.
  const localityPrefix = municipalityCode.slice(0, 6)
  const matches = STATIC_BARANGAYS.filter((item) => item.code.slice(0, 6) === localityPrefix)
  return Promise.resolve(sortByName(matches))
}
