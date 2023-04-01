import { supabase } from '../supabase'

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

export async function createUser(
  recipientPhone: string,
  recipientName?: string,
): Promise<void> {
  const user = await supabase.from('users').insert({
    phone_number: recipientPhone,
    name: recipientName,
  })

  if (user.error) {
    throw new Error('Error creating user')
  }
}
