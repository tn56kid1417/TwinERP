/**
 * Formats a numeric value into USD currency format ($X,XXX.XX)
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Formats a Date object or date string into a readable short date format (e.g. "Oct 12, 2026")
 */
export function formatDate(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats a Date object or date string into a relative human-readable string (e.g. "2 hours ago", "Just now")
 */
export function formatRelativeTime(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInSecs = Math.floor(diffInMs / 1000)
  const diffInMins = Math.floor(diffInSecs / 60)
  const diffInHours = Math.floor(diffInMins / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInSecs < 60) {
    return 'Just now'
  }
  if (diffInMins < 60) {
    return `${diffInMins}m ago`
  }
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  if (diffInDays === 1) {
    return 'Yesterday'
  }
  return formatDate(date)
}
