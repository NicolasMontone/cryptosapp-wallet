import { ethers } from 'ethers'

import { bscUsdtContractAddress } from '.'
import usdtBEP20 from './abis/usdtBEP20.json'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

export async function sendUsdtFromWallet({
  tokenAmount,
  toAddress,
  privateKey,
}: {
  tokenAmount: number
  toAddress: string
  privateKey: string
}) {
  const provider = new ethers.JsonRpcProvider(quickNodeUrl)

  const wallet = new ethers.Wallet(privateKey, provider)

  const walletSigner = wallet.connect(provider)

  // general token send
  const contract = new ethers.Contract(
    bscUsdtContractAddress,
    usdtBEP20,
    walletSigner,
  )

  // How many tokens?
  const numberOfTokens = ethers.parseUnits(String(tokenAmount), 18)
  console.log(`numberOfTokens: ${numberOfTokens}`)
  // Send tokens
  const transferResult = await contract.transfer(toAddress, numberOfTokens)
  return transferResult
}
