import { useEffect, useMemo, useState } from 'react'
import { createEmptyAddressParts, type AddressParts } from '../../data/unifiedData'
import {
  getPsgcBarangays,
  getPsgcMunicipalities,
  getPsgcProvinces,
  getPsgcRegions,
  type PsgcOption,
} from '../../utils/psgc'

type AddressFieldGroupProps = {
  value: AddressParts
  onChange: (next: AddressParts) => void
  disabled?: boolean
  required?: boolean
  className?: string
}

const baseInputClassName =
  'h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384] disabled:bg-slate-50 disabled:text-slate-500'

export default function AddressFieldGroup({ value, onChange, disabled = false, required = false, className }: AddressFieldGroupProps) {
  const [regions, setRegions] = useState<PsgcOption[]>([])
  const [provinces, setProvinces] = useState<PsgcOption[]>([])
  const [municipalities, setMunicipalities] = useState<PsgcOption[]>([])
  const [barangays, setBarangays] = useState<PsgcOption[]>([])

  const [loadingRegions, setLoadingRegions] = useState(false)
  const [loadingProvinces, setLoadingProvinces] = useState(false)
  const [loadingMunicipalities, setLoadingMunicipalities] = useState(false)
  const [loadingBarangays, setLoadingBarangays] = useState(false)

  const [regionsError, setRegionsError] = useState('')
  const [provincesError, setProvincesError] = useState('')
  const [municipalitiesError, setMunicipalitiesError] = useState('')
  const [barangaysError, setBarangaysError] = useState('')

  const municipalityParentCode = value.provinceCode || value.regionCode
  const isProvinceOptional = value.regionCode.length > 0 && provinces.length === 0 && !loadingProvinces

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    async function loadRegions() {
      setLoadingRegions(true)
      setRegionsError('')

      try {
        const items = await getPsgcRegions(controller.signal)
        if (isActive) {
          setRegions(items)
        }
      } catch {
        if (isActive) {
          setRegionsError('Unable to load regions.')
        }
      } finally {
        if (isActive) {
          setLoadingRegions(false)
        }
      }
    }

    loadRegions()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (!value.regionCode) {
      setProvinces([])
      setMunicipalities([])
      setBarangays([])
      return () => {
        isActive = false
        controller.abort()
      }
    }

    async function loadProvinces() {
      setLoadingProvinces(true)
      setProvincesError('')

      try {
        const items = await getPsgcProvinces(value.regionCode, controller.signal)
        if (isActive) {
          setProvinces(items)
        }
      } catch {
        if (isActive) {
          setProvincesError('Unable to load provinces.')
          setProvinces([])
        }
      } finally {
        if (isActive) {
          setLoadingProvinces(false)
        }
      }
    }

    loadProvinces()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [value.regionCode])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (!value.regionCode || !municipalityParentCode || (provinces.length > 0 && !value.provinceCode)) {
      setMunicipalities([])
      setBarangays([])
      return () => {
        isActive = false
        controller.abort()
      }
    }

    async function loadMunicipalities() {
      setLoadingMunicipalities(true)
      setMunicipalitiesError('')

      try {
        const items = await getPsgcMunicipalities(municipalityParentCode, controller.signal)
        if (isActive) {
          setMunicipalities(items)
        }
      } catch {
        if (isActive) {
          setMunicipalitiesError('Unable to load municipalities.')
          setMunicipalities([])
        }
      } finally {
        if (isActive) {
          setLoadingMunicipalities(false)
        }
      }
    }

    loadMunicipalities()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [municipalityParentCode, provinces.length, value.provinceCode, value.regionCode])

  useEffect(() => {
    let isActive = true
    const controller = new AbortController()

    if (!value.municipalityCode) {
      setBarangays([])
      return () => {
        isActive = false
        controller.abort()
      }
    }

    async function loadBarangays() {
      setLoadingBarangays(true)
      setBarangaysError('')

      try {
        const items = await getPsgcBarangays(value.municipalityCode, controller.signal)
        if (isActive) {
          setBarangays(items)
        }
      } catch {
        if (isActive) {
          setBarangaysError('Unable to load barangays.')
          setBarangays([])
        }
      } finally {
        if (isActive) {
          setLoadingBarangays(false)
        }
      }
    }

    loadBarangays()

    return () => {
      isActive = false
      controller.abort()
    }
  }, [value.municipalityCode])

  const provinceDisabled = useMemo(() => disabled || !value.regionCode || loadingProvinces, [disabled, loadingProvinces, value.regionCode])
  const municipalityDisabled = useMemo(
    () => disabled || !value.regionCode || loadingMunicipalities || (provinces.length > 0 && !value.provinceCode),
    [disabled, loadingMunicipalities, provinces.length, value.provinceCode, value.regionCode],
  )
  const barangayDisabled = useMemo(
    () => disabled || !value.municipalityCode || loadingBarangays,
    [disabled, loadingBarangays, value.municipalityCode],
  )

  const ensureAddress = value ?? createEmptyAddressParts()

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AddressSelect
          label="Region"
          required={required}
          value={ensureAddress.regionCode}
          disabled={disabled || loadingRegions}
          options={regions}
          placeholder={loadingRegions ? 'Loading regions...' : '-- Select Region --'}
          errorText={regionsError}
          onChange={(nextCode) => {
            const selected = regions.find((item) => item.code === nextCode)
            onChange({
              ...ensureAddress,
              regionCode: selected?.code ?? '',
              regionName: selected?.name ?? '',
              provinceCode: '',
              provinceName: '',
              municipalityCode: '',
              municipalityName: '',
              barangayCode: '',
              barangayName: '',
            })
          }}
        />

        <AddressSelect
          label="Province"
          required={required}
          value={ensureAddress.provinceCode}
          disabled={provinceDisabled}
          options={provinces}
          placeholder={
            loadingProvinces
              ? 'Loading provinces...'
              : isProvinceOptional
                ? '-- Not Applicable --'
                : '-- Select Province --'
          }
          errorText={provincesError}
          onChange={(nextCode) => {
            const selected = provinces.find((item) => item.code === nextCode)
            onChange({
              ...ensureAddress,
              provinceCode: selected?.code ?? '',
              provinceName: selected?.name ?? '',
              municipalityCode: '',
              municipalityName: '',
              barangayCode: '',
              barangayName: '',
            })
          }}
        />

        <AddressSelect
          label="Municipality/City"
          required={required}
          value={ensureAddress.municipalityCode}
          disabled={municipalityDisabled}
          options={municipalities}
          placeholder={loadingMunicipalities ? 'Loading municipalities...' : '-- Select Municipality/City --'}
          errorText={municipalitiesError}
          onChange={(nextCode) => {
            const selected = municipalities.find((item) => item.code === nextCode)
            onChange({
              ...ensureAddress,
              municipalityCode: selected?.code ?? '',
              municipalityName: selected?.name ?? '',
              barangayCode: '',
              barangayName: '',
            })
          }}
        />

        <AddressSelect
          label="Barangay"
          required={required}
          value={ensureAddress.barangayCode}
          disabled={barangayDisabled}
          options={barangays}
          placeholder={loadingBarangays ? 'Loading barangays...' : '-- Select Barangay --'}
          errorText={barangaysError}
          onChange={(nextCode) => {
            const selected = barangays.find((item) => item.code === nextCode)
            onChange({
              ...ensureAddress,
              barangayCode: selected?.code ?? '',
              barangayName: selected?.name ?? '',
            })
          }}
        />

        <div className="md:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
            Street Address{required ? ' *' : ''}
          </label>
          <input
            value={ensureAddress.streetAddress}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...ensureAddress,
                streetAddress: event.target.value,
              })
            }
            placeholder="House/Block/Lot/Street"
            className={baseInputClassName}
          />
        </div>
      </div>
    </div>
  )
}

type AddressSelectProps = {
  label: string
  required: boolean
  value: string
  options: PsgcOption[]
  disabled: boolean
  placeholder: string
  errorText: string
  onChange: (nextCode: string) => void
}

function AddressSelect({ label, required, value, options, disabled, placeholder, errorText, onChange }: AddressSelectProps) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600">
        {label}{required ? ' *' : ''}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className={baseInputClassName}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.name}
          </option>
        ))}
      </select>
      {errorText ? <p className="mt-1 text-[11px] text-red-600">{errorText}</p> : null}
    </div>
  )
}
