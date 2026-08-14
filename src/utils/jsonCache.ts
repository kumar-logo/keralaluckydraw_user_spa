const jsonCache = new Map<string, Promise<unknown>>()

export const fetchJsonCached = <T = unknown>(url: string): Promise<T> => {
  let cached = jsonCache.get(url)
  if (!cached) {
    cached = fetch(url)
      .then((res) => res.json())
      .catch((err) => {
        jsonCache.delete(url)
        throw err
      })
    jsonCache.set(url, cached)
  }
  return cached as Promise<T>
}
