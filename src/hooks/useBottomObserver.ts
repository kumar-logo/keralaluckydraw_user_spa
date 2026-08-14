import { useEffect, useRef, type DependencyList } from 'react'

export function useBottomObserver({
  onInit,
  onBottom,
  deps = [],
}: {
  onInit?: () => void
  onBottom?: () => void | Promise<void>
  deps?: DependencyList
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    onInit?.()

    let observer: IntersectionObserver | null = null

    if (window?.IntersectionObserver) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio === 1) {
            onBottom?.()
          }
        })
      })

      if (ref.current) observer.observe(ref.current)
    }

    return () => {
      observer?.disconnect()
    }
    // Re-run only when the caller-provided deps change; onInit/onBottom are
    // read as the latest closures and intentionally excluded to avoid
    // forcing callers to memoize them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
