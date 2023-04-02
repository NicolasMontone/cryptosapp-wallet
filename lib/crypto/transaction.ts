import { ethers } from 'ethers'

import { bscUsdtContractAddress } from '.'
import usdtBEP20 from './abis/usdtBEP20.json'

import { getAddressByPhoneNumber, getUserFromPhoneNumber } from 'lib/user'
import { supabase } from '../../lib/supabase'

const quickNodeUrl = process.env.QUICK_NODE_URL

if (!quickNodeUrl) {
  throw new Error('QUICK_NODE_URL is not defined')
}

type Status =
  | 'ADDRESS_PENDING'
  | 'AMOUNT_PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'ERROR'

type PaymentRequest = {
  id: string
  createdAt: string
  fromUserId: string
  to: string
  status: Status
  amount: number | null
}

export type Address = string
export type PhoneNumber = string

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

    // Send tokens
    const transferResult = await contract.transfer(toAddress, numberOfTokens)
    return transferResult
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-extra-semi
    ;(
      error as Error
    ).message = `Error sending USDT from wallet: \n toAddress: ${toAddress}  \n tokenAmount: ${tokenAmount} \n ${
      (error as Error).message
    }`
    throw error
  }
}

export async function getUserPaymentRequests(
  userId: string,
): Promise<PaymentRequest[]> {
  const { data, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('from_user_id', userId)

  if (error) {
    throw new Error('Error getting user payment requests')
  }

  return data.map(({ id, created_at, from_user_id, to, status, amount }) => ({
    id,
    createdAt: created_at,
    fromUserId: from_user_id,
    to,
    status,
    amount,
  }))
}

export async function isUserAwaitingRemitentInput(userId: string) {
  const paymentRequests = await getUserPaymentRequests(userId)

  return paymentRequests.some(
    (paymentRequest) => paymentRequest.status === 'ADDRESS_PENDING',
  )
}

export async function getRecipientAddressFromUncompletedPaymentRequest(
  userId: string,
): Promise<string> {
  const paymentRequests = await getUserPaymentRequests(userId)

  const pendingPaymentRequest = paymentRequests.find(
    (paymentRequest) => paymentRequest.status === 'AMOUNT_PENDING',
  )

  if (!pendingPaymentRequest) {
    throw new Error('No pending payment requests found')
  }

  const addressOrPhoneNumber = pendingPaymentRequest.to

  const isAddress = ethers.isAddress(addressOrPhoneNumber)

  if (isAddress) {
    return addressOrPhoneNumber
  }

  const remitentUser = await getUserFromPhoneNumber(addressOrPhoneNumber)

  if (!remitentUser) {
    throw new Error('Invalid remitent')
  }

  const address = await getAddressByPhoneNumber(addressOrPhoneNumber)

  return address
}

export async function isUserAwaitingAmountInput(userId: string) {
  const paymentRequests = await getUserPaymentRequests(userId)

  return paymentRequests.some(
    (paymentRequest) => paymentRequest.status === 'AMOUNT_PENDING',
  )
}

export async function addRemitentToPaymentRequest({
  userId,
  remitent,
}: {
  userId: string
  remitent: string
}) {
  const isAddress = ethers.isAddress(remitent)
  const remitentUser = await getUserFromPhoneNumber(remitent)

  if (!isAddress && !remitentUser) {
    throw new Error(
      `Invalid remitent, must be a valid address or phone number of a registered user ${JSON.stringify(
        remitent,
      )}`,
    )
  }

  await supabase
    .from('payment_requests')
    .update({
      to: remitent,
      status: 'AMOUNT_PENDING',
    })
    .eq('from_user_id', userId)
    .eq('status', 'ADDRESS_PENDING')

  return remitentUser?.name || isAddress
}

export async function confirmPaymentRequest({
  userId,
  amount,
}: {
  userId: string
  amount: number
}) {
  await supabase
    .from('payment_requests')
    .update({
      amount,
      status: 'CONFIRMED',
    })
    .eq('from_user_id', userId)
    .eq('status', 'AMOUNT_PENDING')
}

export async function cancelPaymentRequest(userId: string) {
  await supabase
    .from('payment_requests')
    .update({
      status: 'CANCELLED',
    })
    .eq('from_user_id', userId)
    .neq('status', 'CONFIRMED')
    .neq('status', 'CANCELLED')
    .neq('status', 'ERROR')
}
export function getBscScanUrlForAddress(address: string) {
  return `https://goto.bscscan.com/address/${address}`
}

export async function updatePaymentRequestToError(userId: string) {
  await supabase
    .from('payment_requests')
    .update({
      status: 'ERROR',
    })
    .eq('from_user_id', userId)
    .eq('status', 'AMOUNT_PENDING')
}
