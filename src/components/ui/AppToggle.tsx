import { useId } from 'react'

type AppToggleProps = {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
}

export default function AppToggle({
  checked,
  onChange,
  disabled = false,
  label,
  description,
}: AppToggleProps) {
  const switchId = useId()

  return (
    <label htmlFor={switchId} className={`flex items-start justify-between gap-3 ${disabled ? 'opacity-60' : ''}`}>
      <div>
        {label ? <p className="text-[13px] font-semibold text-slate-800">{label}</p> : null}
        {description ? <p className="mt-0.5 text-[12px] text-slate-500">{description}</p> : null}
      </div>
      <input
        id={switchId}
        type="checkbox"
        role="switch"
        aria-label={label ?? 'Toggle setting'}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 rounded-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0b5384] ${checked ? 'bg-[#0b5384]' : 'bg-slate-300'} ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
    </label>
  )
}
