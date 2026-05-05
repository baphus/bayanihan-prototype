import { AppButton } from './ui/AppButton'

type TrackerInputProps = {
  trackerNumber: string
  onTrackerChange: (value: string) => void
  onSubmit: () => void
  isDisabled: boolean
  errorMessage?: string
}

export default function TrackerInput({
  trackerNumber,
  onTrackerChange,
  onSubmit,
  isDisabled,
  errorMessage,
}: TrackerInputProps) {
  return (
    <section>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="relative">
          <input
            type="text"
            value={trackerNumber}
            onChange={(event) => onTrackerChange(event.target.value)}
            placeholder="Enter Tracking Number"
            className="w-full border border-outline bg-surface-container px-4 py-4 rounded-none text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary md:px-6 md:py-5"
            aria-label="Tracker Number"
          />
        </div>

        {errorMessage ? <p className="text-sm text-error font-medium">{errorMessage}</p> : null}

        <AppButton
          type="submit"
          disabled={isDisabled}
          variant="mint"
          size="lg"
          fullWidth
          icon="search"
          className="md:py-5"
        >
          Go to Tracking
        </AppButton>
      </form>
    </section>
  )
}