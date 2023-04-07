import { supabase } from '../supabase'

import { buildPrivateKey, getAddressFromPrivateKey } from '../crypto'

export type User = {
  privateKey: string
  id: string
  createdAt: string
  phoneNumer: string
  name: string
  address: string
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
  const user = await getUserFromPhoneNumber(recipientPhone)

  if (!user) {
    throw new Error('User not found')
  }

  return user.address
}

export async function getUserFromId(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)

  if (error || data.length === 0) {
    throw new Error(`Error getting user from id, ${JSON.stringify({ error })}`)
  }

  const [{ created_at, id, name, phone_number, private_key, address }] = data

  return {
    createdAt: created_at,
    id,
    name,
    phoneNumer: phone_number,
    privateKey: private_key,
    address,
  }
}

export async function getAddressByUserId(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('address')
    .eq('id', userId)

  if (error || data.length === 0) {
    throw new Error(
      `Error getting user address, ${JSON.stringify({
        error,
        userId,
      })} `,
    )
  }
  return data[0].address
}

export async function createUser(
  recipientPhone: string,
  recipientName?: string,
): Promise<string> {
  const privateKey = buildPrivateKey()
  const userAddress = getAddressFromPrivateKey(privateKey)

  const user = await supabase.from('users').insert({
    phone_number: recipientPhone,
    name: recipientName,
    private_key: privateKey,
    address: userAddress,
  })

  if (user.error) {
    throw new Error('Error creating user')
  }
  return getAddressFromPrivateKey(privateKey)
}

export async function getUserFromPhoneNumber(
  recipientPhone: string,
): Promise<User | null> {
  const sanitizedPhoneNumber = recipientPhone.replace(/[^0-9.]/g, '')

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

  const [{ created_at, id, name, phone_number, private_key, address }] = users

  return {
    createdAt: created_at,
    id,
    name,
    phoneNumer: phone_number,
    privateKey: private_key,
    address,
  }
}
