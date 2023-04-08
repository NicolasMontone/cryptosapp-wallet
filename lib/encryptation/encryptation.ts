/** npm install --save encrypt-decrypt-library
* @see https://www.npmjs.com/package/encrypt-decrypt-library?activeTab=readme
*/
import Encryption from "encrypt-decrypt-library"

/**
* Global IV, ENCRYPTION_KEY, SALT, ALGORITHM
* Must be defined in Vercel as secrets
* @see https://vercel.com/docs/cli/secrets
*/
const config = {
  algorithm : process.env.ALGORITHM,
  encryptionKey : process.env.ENCRYPTION_KEY,
  salt : process.env.SALT,
}

const encryption = new Encryption(config);

export default {
  decrypt : encryption.decrypt,
  encrypt : encryption.encrypt
}