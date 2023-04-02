import { supabase } from '../supabase'

import { buildPrivateKey, getAddressFromPrivateKey } from '../crypto'

export type User = {
  privateKey: string
  id: string
  createdAt: string
  phoneNumer: string
  name: string
}

type UserResponse = {
  id: string
  created_at: string
  phone_number: string
  name: string
  private_key: string
}

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

export async function getPrivateKeyByPhoneNumber(
  recipientPhone: string,
): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('private_key')
    .eq('phone_number', recipientPhone)

  if (error || data.length === 0) {
    throw new Error(
      `Error getting user address, ${JSON.stringify({
        error,
        recipientPhone,
      })} `,
    )
  }
  return data[0].private_key
}

export async function getAddressByPhoneNumber(
  recipientPhone: string,
): Promise<string> {
  const privateKey = await getPrivateKeyByPhoneNumber(recipientPhone)
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

export async function getUserFromPhoneNumber(
  recipientPhone: string,
): Promise<User | null> {
  const sanitizedPhoneNumber = recipientPhone.replace('+', '').replace(' ', '')

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .like('phone_number', `%${sanitizedPhoneNumber}%`)

  if (error) {
    throw new Error(`Error getting user from phone number ${error}`)
  }

  if (users.length === 0) {
    return null
  }

  const [{ created_at, id, name, phone_number, private_key }] = users

  return {
    createdAt: created_at,
    id,
    name,
    phoneNumer: phone_number,
    privateKey: private_key,
  }
}
