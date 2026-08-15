import { useState } from 'react'
import type { ModuleRow } from '../lib/modules'

export function ModuleMark({ m }: { m: ModuleRow }) {
  const [broken, setBroken] = useState(false)
  const src = m.mark.kind === 'brand' ? m.mark.src : ''
  if (broken || m.mark.kind !== 'brand') {
    return (
      <span className="grid size-full place-items-center text-[13px] font-bold text-fg/80" aria-hidden>
        {(m.label || '?').slice(0, 1)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      data-wide={m.fit === 'wide' ? 'true' : undefined}
      data-tight={m.fit === 'tight' ? 'true' : undefined}
      style={m.invert ? { filter: 'brightness(0) invert(1)' } : undefined}
      onError={() => setBroken(true)}
    />
  )
}
