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

import {
  getUserAddress,
  getUserFromPhoneNumber,
  getUserPrivateKey,
} from '../../lib/user'

import { createUser } from '../../lib/user'

import { getAccountBalances } from 'lib/crypto'
import {
  Address,
  PhoneNumber,
  addAmountToPaymentRequest,
  addRemitentToPaymentRequest,
  cancelPaymentRequest,
  isUserAwaitingAmountInput,
  isUserAwaitingRemitentInput,
  makePaymentRequest,
  sendUsdtFromWallet,
} from '../../lib/crypto/transaction'

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
          text,
        },
      } = data
      const sendCancelSendMoneyFlowMessage = async () => {
        await sendSimpleButtonsMessage(recipientPhone, 'Querés cancelar?', [
          { title: 'Si', id: 'cancel_send_money' },
        ])
      }
      const sendMenuButtons = async () => {
        await sendSimpleButtonsMessage(recipientPhone, 'Qué querés hacer?', [
          { title: 'Consultar dirección', id: 'check_address' },
          { title: 'Enviar dinero 💸', id: 'send_money' },
          { title: 'Consultar saldo 🔎', id: 'check_balance' },
        ])
      }

      try {
        if (typeOfMessage === 'text_message') {
          const user = await getUserFromPhoneNumber(recipientPhone)

          if (user) {
            if (text && (await isUserAwaitingRemitentInput(user.id))) {
              sendCancelSendMoneyFlowMessage()
              const remitent: PhoneNumber | Address = text.body
              try {
                const remitentSuccess = await addRemitentToPaymentRequest({
                  userId: user.id,
                  remitent,
                })
                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `Cuánto dinero deseas enviar a ${remitentSuccess}?`,
                )
                return
              } catch {
                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `El valor no es válido, fijate que cumpla con el formato de dirección o que el número de teléfono tenga cuenta con Cryptosapp`,
                )
              }
              return
            }
            if (text && (await isUserAwaitingAmountInput(user.id))) {
              sendCancelSendMoneyFlowMessage()
              const amount = Number(text.body)

              sendUsdtFromWallet({
                tokenAmount: amount,
                privateKey: await getUserPrivateKey(user.id),
                toAddress: await getUserAddress(user.id),
              })

              addAmountToPaymentRequest({ userId: user.id, amount })

              await sendMessageToPhoneNumber(recipientPhone, `Pago exitoso.`)

              return
            }

            await sendMessageToPhoneNumber(
              recipientPhone,
              `Hola de nuevo${recipientName ? ` ${recipientName}` : ''}! 👋`,
            )
            await sendMenuButtons()
          } else {
            const welcomeMessage = `¡Hola ${recipientName}!, soy tu crypto-bot favorito.\nTu servicio de billetera digital más seguro, confiable y fácil de usar.`

            await sendMessageToPhoneNumber(recipientPhone, welcomeMessage)
            await sendSimpleButtonsMessage(
              recipientPhone,
              'Veo que no tienes una billetera asociada a éste número.  Deseas crear una?',
              [{ title: 'Crear una billetera', id: 'create_wallet' }],
            )
          }
        }

        if (typeOfMessage === 'simple_button_message') {
          const button_id = data.message.button_reply.id

          const user = await getUserFromPhoneNumber(recipientPhone)

          if (!user) {
            await sendSimpleButtonsMessage(
              recipientPhone,
              `No tienes una billetera asociada a éste número. Deseas crear una?`,
              [{ title: 'Crear una billetera', id: 'create_wallet' }],
            )
            return
          }

          switch (button_id) {
            case 'send_money': {
              const { id } = user

              await makePaymentRequest({
                amount: null,
                fromUserId: id,
                to: null,
              })

              await sendMessageToPhoneNumber(
                recipientPhone,
                `A quién deseas enviar dinero? Ingresa el número de celular de tu amigo o la dirección de su billetera`,
              )
              break
            }
            case 'check_balance': {
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Consultando tu saldo 🤑',
              )
              const privateKey = await getUserPrivateKey(recipientPhone)

              const { bnbBalance, usdtBalance } = await getAccountBalances(
                privateKey,
              )

              await sendMessageToPhoneNumber(
                recipientPhone,
                '¡Acá tenés tu saldo!',
              )
              await sendMessageToPhoneNumber(
                recipientPhone,
                `BNB: ${bnbBalance} BNB`,
              )
              await sendMessageToPhoneNumber(
                recipientPhone,
                `USDT: ${usdtBalance} USDT`,
              )

              break
            }
            case 'check_address': {
              const address = await getUserAddress(recipientPhone)
              await sendMessageToPhoneNumber(recipientPhone, 'Tu dirección es:')
              await sendMessageToPhoneNumber(recipientPhone, address)
              await sendMenuButtons()
              break
            }
            case 'create_wallet': {
              await sendMessageToPhoneNumber(
                recipientPhone,
                '¡Creando tu billetera! 🔨',
              )

              const walletAddress = await createUser(
                recipientPhone,
                recipientName,
              )

              await sendMessageToPhoneNumber(
                recipientPhone,
                '¡Tu billetera ha sido creada! 🚀✨, tu dirección es:',
              )
              await sendSimpleButtonsMessage(recipientPhone, walletAddress, [
                { title: 'Qué es una dirección?', id: 'info_address' },
              ])
              await sendSimpleButtonsMessage(
                recipientPhone,
                'Te comento que para transferir dinero ' +
                  'tenes que cargar BNB.',
                [{ title: 'Qué es BNB?', id: 'info_bnb' }],
              )
              break
            }
            case 'info_address':
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Una dirección es como un número de cuenta bancaria que puedes usar para recibir dinero de otras personas.',
              )
              break
            case 'info_bnb':
              await sendMessageToPhoneNumber(
                recipientPhone,
                'El BNB es el combustible que necesita la blockchain para poner en funcionamiento la red.',
              )
              await sendMenuButtons()
              break
            case 'cancel_send_money':
              await cancelPaymentRequest(user.id)
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Cancelaste el envío.',
              )
              await sendMenuButtons()
              break
            default:
              break
          }
        }
      } catch (error) {
        console.error({ error })
        await sendMessageToPhoneNumber(
          recipientPhone,
          `🔴 Ha ocurrido un error: ${(error as Error).message}`,
        )
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
