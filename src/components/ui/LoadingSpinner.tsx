import type { CSSProperties } from 'react'

interface LoadingSpinnerProps {
  size?: number
  color?: string
  className?: string
}

export function LoadingSpinner({ size = 32, color = 'var(--accent)', className }: LoadingSpinnerProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    border: `3px solid color-mix(in srgb, ${color} 20%, transparent)`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  }

  return (
    <div className={className} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <div style={style} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
