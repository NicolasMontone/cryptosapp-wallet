import type { VercelApiHandler, VercelResponse } from '@vercel/node'

import { Whatsapp, sendMessageToPhoneNumber } from '../../lib/whatsapp'

import {
  WhatsappNewMessageEventNotificationRequest,
  WhatsappParsedMessage,
} from './types'

const handler: VercelApiHandler = async (
  req: WhatsappNewMessageEventNotificationRequest,
  res: VercelResponse,
) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  try {
    const data: WhatsappParsedMessage = Whatsapp.parseMessage(req.body)

    if (data?.isMessage) {
      // const incomingMessage = data.message

      const {
        message: {
          from: { phone: recipientPhone, name: recipientName },
          type: typeOfMessage,
          message_id: messageId,
          // text,
        },
      } = data

      if (typeOfMessage === 'text_message') {
        const message = `Hey ${recipientName}, thanks for reaching out! We will get back to you shortly.`
        await sendMessageToPhoneNumber(recipientPhone, message)
      }

      if (typeOfMessage === 'simple_button_message') {
        // button
      }

      // note: important to mark message as read to avoid duplicate messages
      await Whatsapp.markMessageAsRead({
        message_id: messageId,
      })
    }

    res.status(200).send('ok')
    return
  } catch (error) {
    console.error({ error })
    res.status(500)
    return
  }
}

export default handler
