interface JwtPayload {
  userId?: string
}

export const decodeJwtUserId = (token: string | null): string => {
  if (!token) return ''
  const parts = token.split('.')
  if (parts.length < 2) return ''
  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(normalized)
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    )
    const payload = JSON.parse(json) as JwtPayload
    return payload.userId ?? ''
  } catch {
    return ''
  }
}
