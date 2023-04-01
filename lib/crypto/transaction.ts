import { ethers } from 'ethers'

import { bscUsdtContractAddress } from '.'
import usdtBEP20 from './abis/usdtBEP20.json'

import { supabase } from '../../lib/supabase'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

type PaymentRequest = {
  status:
    | 'ADDRESS_PENDING'
    | 'AMOUNT_PENDING'
    | 'CONFIRMED'
    | 'CANCELLED'
    | 'ERROR'
  amount: number
  addressFrom: string
  addressTo: string
}

type Address = string
type PhoneNumber = string

export async function makePaymentRequest({
  fromUserId,
  to,
  amount,
}: {
  fromUserId: string
  to: Address | PhoneNumber | null
  amount: number | null
}): Promise<PaymentRequest> {
  // TODO: validate user has enough balance

  const paymentRequest = (await supabase.from('payment_requests').insert({
    status: 'ADDRESS_PENDING',
    amount,
    from_user_id: fromUserId,
    to: to,
  })) as unknown as PaymentRequest

  return paymentRequest
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
  try {
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
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(
      error as Error
    ).message = `Error sending USDT from wallet: \n toAddress: ${toAddress} \n privateKey: ${privateKey} \n tokenAmount: ${tokenAmount} \n ${error.message}`
    throw error
  }
}
