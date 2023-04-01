import crypto from 'crypto'

import { ethers } from 'ethers'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

export async function getAdressBalance(address: string): Promise<bigint> {
  const provider = new ethers.JsonRpcProvider(quickNodeUrl)
  return await provider.getBalance(address, 'latest')
}

export function buildPrivateKey() {
  const id = crypto.randomBytes(32).toString('hex')
  const privateKey = '0x' + id
  return privateKey
}

export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey)
  return wallet.address
}
