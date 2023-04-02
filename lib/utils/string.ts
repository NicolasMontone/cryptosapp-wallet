/**
 * Given a string value, return a normalized version of it, which implies
 * using a standard version for any accents such as 'ó', using lowerCase,
 * and removing all diacritics/special characters
 *
 * @param value - the string to normalize
 */
export function normalizeString(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * return a number from a string value, removing all non numeric characters
 * @param value
 * @returns
 */
export function transformStringToNumber(value: string): number {
  const number = Number(value.replace(/\D/g, ''))
  if (Number.isNaN(number)) {
    throw new Error(`Invalid number ${value}`)
  }

  return number
}
