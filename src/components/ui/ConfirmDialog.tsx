type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
      <div className="w-full max-w-md rounded-[4px] border border-[#cbd5e1] bg-white shadow-xl">
        <div className="border-b border-[#e2e8f0] px-5 py-4">
          <h2 className="text-[16px] font-extrabold text-slate-900">{title}</h2>
          <p className="mt-1 text-[13px] text-slate-600">{message}</p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 rounded-[3px] border border-[#cbd5e1] px-3 text-[12px] font-bold text-slate-700"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 rounded-[3px] px-3 text-[12px] font-bold text-white ${tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0b5384] hover:bg-[#09416a]'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
