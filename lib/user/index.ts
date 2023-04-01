import { supabase } from '../supabase'

import { getAddressFromPrivateKey, buildPrivateKey } from '../crypto'

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

export async function getUserPrivateKey(
  recipientPhone: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('private_key')
    .eq('phone_number', recipientPhone)

  if (error || !data.length) {
    throw new Error('Error getting user address')
  }
  return data[0].private_key
}

export async function getUserAddress(recipientPhone: string): Promise<string> {
  const privateKey = await getUserPrivateKey(recipientPhone)
  return getAddressFromPrivateKey(privateKey)
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
