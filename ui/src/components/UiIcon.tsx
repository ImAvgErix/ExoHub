import {
  ArrowUpRight,
  ArrowsClockwise,
  Check,
  CircleNotch,
  Coffee,
  Bug,
  FileText,
  Gear,
  Heart,
  House,
  Shield,
  X,
  type IconProps,
} from '@phosphor-icons/react'
import type { ComponentType } from 'react'

export type UiIconName =
  | 'gear'
  | 'close'
  | 'home'
  | 'refresh'
  | 'spinner'
  | 'check'
  | 'arrowUpRight'
  | 'fileText'
  | 'coffee'
  | 'heart'
  | 'shield'
  | 'bug'

const icons: Record<UiIconName, ComponentType<IconProps>> = {
  gear: Gear,
  close: X,
  home: House,
  refresh: ArrowsClockwise,
  spinner: CircleNotch,
  check: Check,
  arrowUpRight: ArrowUpRight,
  fileText: FileText,
  coffee: Coffee,
  heart: Heart,
  shield: Shield,
  bug: Bug,
}

export function UiIcon({
  name,
  size = 16,
  className,
  color,
  weight,
  spin,
}: {
  name: UiIconName
  size?: number
  className?: string
  color?: string
  weight?: IconProps['weight']
  spin?: boolean
}) {
  const Icon = icons[name]
  return (
    <Icon
      className={className}
      size={size}
      color={color}
      weight={weight ?? 'regular'}
      style={spin ? { animation: 'exo-spin 900ms linear infinite' } : undefined}
      aria-hidden="true"
      focusable="false"
    />
  )
}
