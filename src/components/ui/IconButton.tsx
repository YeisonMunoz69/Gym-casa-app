import type { LucideIcon } from 'lucide-react'
import './IconButton.css'

type IconButtonVariant = 'ghost' | 'filled' | 'outlined'
type IconButtonSize = 'sm' | 'md' | 'lg'

type IconButtonProps = {
  icon: LucideIcon
  variant?: IconButtonVariant
  size?: IconButtonSize
  onClick?: () => void
  ariaLabel: string
  disabled?: boolean
  className?: string
}

const ICON_SIZES: Record<IconButtonSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
}

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  onClick,
  ariaLabel,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const classNames = [
    'icon-btn',
    `icon-btn--${variant}`,
    `icon-btn--${size}`,
    className,
  ].join(' ').trim()

  return (
    <button
      className={classNames}
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
    >
      <Icon size={ICON_SIZES[size]} />
    </button>
  )
}
