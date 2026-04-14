import type { ReactNode } from 'react'

type SystemSettingFieldProps = {
  label: string
  helpText?: string
  tooltip?: string
  error?: string | null
  children: ReactNode
}

export default function SystemSettingField({
  label,
  helpText,
  tooltip,
  error,
  children,
}: SystemSettingFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-600">{label}</label>
        {tooltip ? (
          <span
            title={tooltip}
            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-500"
          >
            ?
          </span>
        ) : null}
      </div>
      {children}
      {helpText ? <p className="text-[12px] text-slate-500">{helpText}</p> : null}
      {error ? <p className="text-[12px] font-semibold text-red-600">{error}</p> : null}
    </div>
  )
}
