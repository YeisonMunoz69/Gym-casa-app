import './Card.css'

type CardProps = {
  children: React.ReactNode
  variant?: 'default' | 'glass' | 'outlined'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
}

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const classNames = [
    'card',
    `card--${variant}`,
    `card--pad-${padding}`,
    onClick ? 'card--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag className={classNames} onClick={onClick}>
      {children}
    </Tag>
  )
}
