import { cn } from '../../lib/utils'

export function Avatar({ src, alt, fallback, className }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white font-medium',
          className
        )}
      >
        {fallback || '?'}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn('h-10 w-10 rounded-full object-cover', className)}
    />
  )
}

import { useState } from 'react'
