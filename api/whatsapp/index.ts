import type { VercelApiHandler, VercelResponse } from '@vercel/node'

import axios from 'axios'

import { WhatsappNewMessageEventNotificationRequest } from './types'

import { sleep } from '../../lib/utils/sleep'

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
      axios.post(
        `https://${process.env.VERCEL_PROD_URL}/api/whatsapp/message`,
        req.body,
      )
      // add sleep to ensure that the request to the other lambda function is completed
      // (should not happen but, since it's a hackathon we are doing this "defensive progrraming")
      await sleep(300)
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
