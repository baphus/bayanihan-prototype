type CountryCodePhoneInputProps = {
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
}

const COUNTRY_CODE_OPTIONS = ['+63', '+1', '+44', '+61', '+65', '+971']

function splitPhoneValue(value: string): { code: string; number: string } {
  const trimmed = value.trim()

  if (!trimmed) {
    return { code: '+63', number: '' }
  }

  const match = trimmed.match(/^(\+\d{1,4})\s*(.*)$/)
  if (!match) {
    return { code: '+63', number: trimmed }
  }

  const code = COUNTRY_CODE_OPTIONS.includes(match[1]) ? match[1] : '+63'
  const number = match[2]?.trim() ?? ''

  return { code, number }
}

function composePhoneValue(code: string, number: string): string {
  const normalizedNumber = number.trim()
  if (!normalizedNumber) {
    return ''
  }

  return `${code} ${normalizedNumber}`
}

export default function CountryCodePhoneInput({ value, onChange, disabled = false }: CountryCodePhoneInputProps) {
  const { code, number } = splitPhoneValue(value)

  return (
    <div className="flex w-full gap-2">
      <select
        value={code}
        disabled={disabled}
        onChange={(event) => onChange(composePhoneValue(event.target.value, number))}
        className="h-10 w-[92px] rounded-[3px] border border-[#cbd5e1] px-2 text-[13px] font-semibold text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384] bg-white"
      >
        {COUNTRY_CODE_OPTIONS.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>

      <input
        type="tel"
        value={number}
        disabled={disabled}
        onChange={(event) => onChange(composePhoneValue(code, event.target.value))}
        className="h-10 w-full rounded-[3px] border border-[#cbd5e1] px-3 text-[13px] text-slate-700 outline-none focus:border-[#0b5384] focus:ring-1 focus:ring-[#0b5384]"
        placeholder="9123456789"
      />
    </div>
  )
}
