const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 2027-01-12 becomes Jan 12, 2027. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`
}

/** Jan 12 to Apr 30, 2027, or with both years when they differ. */
export function formatRange(start: string, end: string): string {
  const [ys, ms, ds] = start.split('-')
  const [ye, me, de] = end.split('-')
  const left = `${MONTHS[Number(ms) - 1]} ${Number(ds)}`
  const right = `${MONTHS[Number(me) - 1]} ${Number(de)}, ${ye}`
  return ys === ye ? `${left} to ${right}` : `${left}, ${ys} to ${right}`
}

export const TONES = ['var(--teal)', 'var(--teal-mid)', 'var(--orange)', 'var(--teal-deep)', 'var(--green)']

/** A stable avatar colour per handle. */
export function tone(handle: string): string {
  let hash = 0
  for (const ch of handle) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length] as string
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
