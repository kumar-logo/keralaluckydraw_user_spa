const parseParts = (value: string): number[] =>
  value
    .trim()
    .split('.')
    .map((part) => {
      const n = parseInt(part, 10)
      return Number.isFinite(n) ? n : 0
    })

export const compareVersions = (a: string, b: string): number => {
  const pa = parseParts(a)
  const pb = parseParts(b)
  const len = Math.max(pa.length, pb.length)
  while (pa.length < len) pa.push(0)
  while (pb.length < len) pb.push(0)
  for (let i = 0; i < len; i += 1) {
    if (pa[i] > pb[i]) return 1
    if (pa[i] < pb[i]) return -1
  }
  return 0
}
