import type { VercelApiHandler, VercelResponse } from '@vercel/node'

import {
  Whatsapp,
  sendMessageToPhoneNumber,
  sendSimpleButtonsMessage,
} from '../../lib/whatsapp'

import {
  WhatsappNewMessageEventNotificationRequest,
  WhatsappParsedMessage,
} from './types'

const hasAssociatedWallet = (_recipientPhone: string) => {
  // do something
  return true // just for testing
}

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
        const message = `¡Hola! ${recipientName}, soy tu crypto-bot favorito.\nTu servicio de billetera digital más seguro, confiable y fácil de usar.`

        await sendMessageToPhoneNumber(recipientPhone, message)
        if (hasAssociatedWallet(recipientPhone)) {
          await sendSimpleButtonsMessage(recipientPhone, '¿Qué deseas hacer?', [
            { title: 'Recibir dinero', id: 'receive_money' },
            { title: 'Enviar dinero', id: 'send_money' },
            { title: 'Consultar saldo', id: 'check_balance' },
          ])
        } else {
          await sendSimpleButtonsMessage(
            recipientPhone,
            'Veo que no tienes una billetera asociada a este número. ¿Deseas crear una?',
            [{ title: 'Crear una billetera', id: 'create_wallet' }],
          )
        }
      }

      if (typeOfMessage === 'simple_button_message') {
        const button_id = data.message.button_reply.id
        switch (button_id) {
          case 'receive_money':
            await sendMessageToPhoneNumber(
              recipientPhone,
              'Recibiendo dinero...',
            )
            break
          case 'send_money':
            // do something
            await sendMessageToPhoneNumber(
              recipientPhone,
              `Hemos enviado tu dinero. Tu saldo es ...`,
            )
            break
          case 'check_balance':
            // do something
            await sendMessageToPhoneNumber(recipientPhone, `Tu balance es ...`)
            break
          default:
            break
        }
      }

      // note: important to mark message as read to avoid duplicate messages
      await Whatsapp.markMessageAsRead({
        message_id: messageId,
      })

      res.status(200).send('ok')
      return
    }
  } catch (error) {
    console.error({ error })
    res.status(500)
    return
  }
}

export default handler
