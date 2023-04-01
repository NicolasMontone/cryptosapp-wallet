import axios from 'axios'
import crypto from 'crypto'

import { ethers } from 'ethers'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

type BSCScanResponse<T> = { status: string; message: string; result: T }

type USDTSmallestUnit = string

type BSCScanAccountResponse = BSCScanResponse<USDTSmallestUnit>

const bscUsdtContractAddress = '0x55d398326f99059ff775485246999027b3197955'

export async function getAddressUSDTBalance(
  address: string,
): Promise<USDTSmallestUnit> {
  const url = `https://api.bscscan.com/api?module=account&action=tokenbalance&contractaddress=${bscUsdtContractAddress}&address=${address}&apikey=${process.env.BSCSCAN_API_KEY}`

  const {
    data: { result: weiAmount },
  } = await axios.get<BSCScanAccountResponse>(url)

  return `${Number(weiAmount) / 10 ** 18} USDT`
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
