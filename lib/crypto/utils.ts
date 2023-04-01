const salt = process.env.SALT

if (!salt) {
  throw new Error('Missing salt')
}

/**
 * Encrypt a string
 * @see https://stackoverflow.com/questions/18279141/javascript-string-encryption-and-decryption
 * @param text
 * @returns
 */
export function crypt(text: string): string {
  const textToChars = (text: string) =>
    text.split('').map((c: string) => c.charCodeAt(0))
  const byteHex = (n: string) => ('0' + Number(n).toString(16)).substr(-2)
  const applySaltToChar = (code: number): number =>
    // note salt is already defined typescript is not inferring the type correctly
    textToChars(salt!).reduce((a, b) => a ^ b, code)

  return (
    text
      .split('')
      .map(textToChars)
      // note: using any here because the typescript compiler is not able to infer the type of the array
      .map(applySaltToChar as any)
      .map(byteHex as any)
      .join('')
  )
}

/**
 * Decrypt a string
 * @see https://stackoverflow.com/questions/18279141/javascript-string-encryption-and-decryption
 * @param encoded
 * @returns
 */
export function decrypt(encoded: string): string {
  const textToChars = (text: string) => text.split('').map((c: string) => c.charCodeAt(0))
  const applySaltToChar = (code: string) =>
    // note salt is already defined typescript is not inferring the type correctly
    textToChars(salt!).reduce((a, b) => a ^ b, code)
    // @ts-ignore
  return encoded?
    .match(/.{1,2}/g)
    .map((hex) => parseInt(hex, 16))
    .map(applySaltToChar)
    .map((charCode) => String.fromCharCode(charCode))
    .join('')
}
