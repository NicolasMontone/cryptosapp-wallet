import { supabase } from '../lib/supabase'
import { getAddressFromPrivateKey } from '../lib/crypto'
;(async () => {
  const { data: users, error } = await supabase.from('users').select('*')

  if (error) {
    throw new Error('Error getting users')
  }

  for (const user of users) {
    const userAdress = getAddressFromPrivateKey(user.private_key)
    const { error } = await supabase
      .from('users')
      .update({ address: userAdress })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating user', user)
    }
  }
})()
