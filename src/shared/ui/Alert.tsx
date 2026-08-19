type AlertProps = {
  tone?: 'error' | 'info' | 'success'
  children: React.ReactNode
}

export function Alert({ tone = 'error', children }: AlertProps) {
  return (
    <div className={`alert alert--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
