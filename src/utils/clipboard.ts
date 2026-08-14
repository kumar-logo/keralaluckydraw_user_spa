import { toast } from './toast'

const fallbackCopy = (text: string, onSuccess: () => void) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    onSuccess()
  } catch { /* ignore */ }
  document.body.removeChild(textarea)
}

export const copyToClipboard = (text: string, successMsg = 'Copied') => {
  const clipboard = navigator.clipboard
  try {
    if (clipboard) {
      clipboard.writeText(text).then(() => toast.success(successMsg)).catch(() => fallbackCopy(text, () => toast.success(successMsg)))
    } else {
      fallbackCopy(text, () => toast.success(successMsg))
    }
  } catch {
    fallbackCopy(text, () => toast.success(successMsg))
  }
}
