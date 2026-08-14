import { cn } from '../lib/utils'

export function Meter({
  label,
  value,
  detail,
}: {
  label: string
  value: number
  detail: string
}) {
  const v = Math.round(value)
  const hot = v >= 85
  return (
    <div className="card flex flex-col p-4">
      <p className="text-[12px] font-medium text-muted">{label}</p>
      <p
        className={cn(
          'mt-2 tabular text-[2.25rem] font-semibold tracking-tight leading-none',
          hot ? 'text-bad' : 'text-fg',
        )}
      >
        {v}
        <span className="ml-0.5 text-[1rem] font-medium text-muted">%</span>
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-elevated">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            hot ? 'bg-bad' : 'bg-fg/70',
          )}
          style={{ width: `${v}%` }}
        />
      </div>
      <p className="mt-2 truncate text-[12px] text-faint">{detail}</p>
    </div>
  )
}
