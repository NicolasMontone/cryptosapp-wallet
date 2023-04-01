import axios from 'axios'
import crypto from 'crypto'

import { ethers } from 'ethers'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

type BSCScanResponse<T> = { status: '0'; message: string; result: T }

type WeiAmount = string

type BSCScanAccountResponse = BSCScanResponse<WeiAmount>

export async function getAddressBalance(address: string): Promise<WeiAmount> {
  const url = `https://api.bscscan.com/api?module=account&action=balance&address=${address}&apikey=${process.env.BSCSCAN_API_KEY}}`

  const {
    data: { result: weiAmount },
  } = await axios.get<BSCScanAccountResponse>(url)

  return `${url}  |  ${weiAmount}`
}

export function buildPrivateKey(): string {
  const id = crypto.randomBytes(32).toString('hex')
  const privateKey = `0x${id}`
  return privateKey
}

export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey)
  return wallet.address
}
