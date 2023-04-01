import { supabase } from '../supabase'

import crypto from 'crypto'
import { ethers } from 'ethers'

export async function isUserRegistered(
  recipientPhone: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('phone_number')
    .eq('phone_number', recipientPhone)
  if (error) {
    throw new Error('Error checking if user is registered')
  }
  return data.length > 0
}

function buildPrivateKey() {
  const id = crypto.randomBytes(32).toString('hex')
  const privateKey = '0x' + id
  return privateKey
}

export function getAddressFromPrivateKey(privateKey: string): string {
  const wallet = new ethers.Wallet(privateKey)
  return wallet.address
}

export async function createUser(
  recipientPhone: string,
  recipientName?: string,
): Promise<string> {
  const privateKey = buildPrivateKey()

  const user = await supabase.from('users').insert({
    phone_number: recipientPhone,
    name: recipientName,
    private_key: privateKey,
  })

  if (user.error) {
    throw new Error('Error creating user')
  }
  return getAddressFromPrivateKey(privateKey)
}
