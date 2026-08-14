const ENABLED = import.meta.env.VITE_COPY_SHIELD !== 'false'

const isBlockedShortcut = (e: KeyboardEvent): boolean => {
  if (e.key === 'F12') return true
  const k = e.key.toLowerCase()
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) {
    return true
  }
  if ((e.ctrlKey || e.metaKey) && (k === 'u' || k === 's')) return true
  return false
}

let installed = false

export function installCopyShield(): void {
  if (!ENABLED || installed || typeof document === 'undefined') return
  installed = true

  const onContextMenu = (e: MouseEvent) => e.preventDefault()

  const onKeyDown = (e: KeyboardEvent) => {
    if (isBlockedShortcut(e)) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const onDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null
    if (target && target.tagName === 'IMG') e.preventDefault()
  }

  document.addEventListener('contextmenu', onContextMenu)
  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('dragstart', onDragStart)
}
