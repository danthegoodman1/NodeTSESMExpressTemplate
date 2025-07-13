export function extractError(e: any | Error) {
  return Object.fromEntries(
    Object.getOwnPropertyNames(e).map((key) => [key, e[key]])
  )
}

export function getSQLiteDate(dateString: string): Date {
  // 2024-01-20 22:41:22 format
  return new Date(dateString.replace(" ", "T") + "Z")
}
