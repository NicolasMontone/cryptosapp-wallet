import type { VercelApiHandler, VercelResponse } from '@vercel/node'

import axios from 'axios'

import { WhatsappNewMessageEventNotificationRequest } from './types'

const handler: VercelApiHandler = async (
  req: WhatsappNewMessageEventNotificationRequest,
  res: VercelResponse,
) => {
  if (req.method === 'GET') {
    try {
      const mode = req.query['hub.mode']
      const token = req.query['hub.verify_token']
      const challenge = req.query['hub.challenge']

      if (
        mode &&
        token &&
        mode === 'subscribe' &&
        process.env.META_WA_VERIFY_TOKEN === token
      ) {
        res.status(200).send(challenge)
        return
      } else {
        res.status(401).json({ message: 'Unauthorized' })
        return
      }
    } catch (error) {
      console.error({ error })
      res.status(500)
      return
    }
  } else if (req.method === 'POST') {
    try {
      // send request to other lambda function but not await it to responde immediately to whatsapp with a 200 status code
      axios.post(
        `https://${process.env.VERCEL_PROD_URL}/api/whatsapp/message`,
        req.body,
      )
    } catch (error) {
      console.error({ error })
    }

    // wait 1 second
    await new Promise((resolve) => setTimeout(resolve, 2000))

    res.status(200).send('ok')
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
  return
}

export default handler
