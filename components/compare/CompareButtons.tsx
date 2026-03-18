interface CompareButtonsProps {
  leftName: string
  rightName: string
  onChooseLeft: () => void
  onChooseRight: () => void
}

export default function CompareButtons({
  leftName,
  rightName,
  onChooseLeft,
  onChooseRight,
}: CompareButtonsProps) {
  return (
    <div className="flex gap-3 px-4">
      <button
        onClick={onChooseLeft}
        className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-emerald-900 active:bg-emerald-800 rounded-2xl text-sm font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="truncate max-w-[120px]">{leftName}</span>
      </button>
      <button
        onClick={onChooseRight}
        className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-emerald-900 active:bg-emerald-800 rounded-2xl text-sm font-semibold text-zinc-200 transition-colors flex items-center justify-center gap-2"
      >
        <span className="truncate max-w-[120px]">{rightName}</span>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
