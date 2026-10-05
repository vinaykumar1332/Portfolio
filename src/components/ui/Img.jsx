import { useState } from 'react'
import { asset } from '../../lib/asset'

/**
 * Common image renderer used for every config image.
 * Takes the config shape { src, alt, width, height } and handles base-URL
 * resolution, lazy loading, a shimmer placeholder and a graceful fallback.
 */
export default function Img({ image, className = '', priority = false, sizes }) {
  const [status, setStatus] = useState('loading')
  if (!image?.src) return null
  const { src, alt = '', width, height } = image

  return (
    <span
      className={`img ${className}`}
      data-status={status}
      style={width && height ? { aspectRatio: `${width} / ${height}` } : undefined}
    >
      {status !== 'error' ? (
        <img
          src={asset(src)}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          draggable="false"
          ref={(el) => {
            // Cached images can finish before React attaches onLoad
            if (el?.complete && el.naturalWidth && status === 'loading') setStatus('loaded')
          }}
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('error')}
        />
      ) : (
        <span className="img-fallback" role="img" aria-label={alt}>
          {alt}
        </span>
      )}
    </span>
  )
}
