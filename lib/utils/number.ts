/**
 * return a number from a string value, removing all non numeric characters
 * @param value
 * @returns
 */
export function transformStringToNumber(value: string): number {
  const number = Number(value.replace(',', '.').replace(/[^0-9.]/g, ''))
  if (Number.isNaN(number)) {
    throw new Error(`Invalid number ${value}`)
  }

  return number
}
