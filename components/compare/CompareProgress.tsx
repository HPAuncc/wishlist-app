interface CompareProgressProps {
  remaining: number
}

export default function CompareProgress({ remaining }: CompareProgressProps) {
  return (
    <div className="px-4 text-center">
      <p className="text-zinc-500 text-sm">
        {remaining > 0 ? (
          <>
            <span className="text-zinc-300 font-semibold">{remaining}</span>{' '}
            comparison{remaining !== 1 ? 's' : ''} left
          </>
        ) : (
          <span className="text-emerald-400">List fully ranked!</span>
        )}
      </p>
    </div>
  )
}
