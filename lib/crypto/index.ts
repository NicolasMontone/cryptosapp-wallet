import crypto from 'crypto'

import { ethers } from 'ethers'

import usdtBEP20 from './abis/usdtBEP20.json'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

export const bscUsdtContractAddress =
  '0x55d398326f99059ff775485246999027b3197955'

type Numberish = number | bigint

/**
 * helper function to remove 18 decimals from a number
 * @param number
 * @returns
 */
function removeDecimals(number: Numberish): number {
  return Number(number) / 10 ** 18
}

export async function getAccountBalances(privateKey: string): Promise<{
  bnbBalance: number
  usdtBalance: number
}> {
  const provider = new ethers.JsonRpcProvider(quickNodeUrl)

  const wallet = new ethers.Wallet(privateKey)

  const walletSigner = wallet.connect(provider)

  const usdtContract = new ethers.Contract(
    bscUsdtContractAddress,
    usdtBEP20,
    walletSigner,
  )

  const bnbBalance = await provider.getBalance(wallet.address, 'latest')

  const usdtBalance = await usdtContract.balanceOf(wallet.address)

  return {
    bnbBalance: removeDecimals(bnbBalance),
    usdtBalance: removeDecimals(usdtBalance),
  }
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
