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
  isUserAwaitingAmountInput,
  isUserAwaitingRemitentInput,
  makePaymentRequest,
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
      const sendBasicTransactions = async () => {
        await sendSimpleButtonsMessage(recipientPhone, 'Qué querés hacer?', [
          { title: 'Recibir dinero ⬇️', id: 'receive_money' },
          { title: 'Enviar dinero 💸', id: 'send_money' },
          { title: 'Consultar saldo 🔎', id: 'check_balance' },
        ])
        await sendSimpleButtonsMessage(recipientPhone, 'También puedes', [
          { title: 'Consultar direccion', id: 'check_address' },
        ])
      }

      try {
        if (typeOfMessage === 'text_message') {
          const user = await getUserFromPhoneNumber(recipientPhone)

          if (user) {
            if (text && (await isUserAwaitingRemitentInput(user.id))) {
              const remitent: PhoneNumber | Address = text.body
              try {
                const remitentSuccess = await addRemitentToPaymentRequest({
                  userId: user.id,
                  remitent,
                })
                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `¿Cuánto dinero deseas enviar a ${remitentSuccess}?`,
                )
                return
              } catch {
                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `El valor no es válido, fijate que cumpla con el formato de dirección o que número de teléfono tenga cuenta con Cryptosapp`,
                )
              }
            }
            if (text && (await isUserAwaitingAmountInput(user.id))) {
              const amount = Number(text.body)

              addAmountToPaymentRequest({ userId: user.id, amount })

              await sendMessageToPhoneNumber(recipientPhone, `Pago exitoso`)

              return
            }

            await sendMessageToPhoneNumber(
              recipientPhone,
              `Hola de nuevo${recipientName ? ` ${recipientName}` : ''}! 👋`,
            )
            await sendBasicTransactions()
          } else {
            const welcomeMessage = `¡Hola! ${recipientName}, soy tu crypto-bot favorito.\nTu servicio de billetera digital más seguro, confiable y fácil de usar.`

            await sendMessageToPhoneNumber(recipientPhone, welcomeMessage)
            await sendSimpleButtonsMessage(
              recipientPhone,
              'Veo que no tienes una billetera asociada a éste número. ¿Deseas crear una?',
              [{ title: 'Crear una billetera', id: 'create_wallet' }],
            )
          }
        }

        if (typeOfMessage === 'simple_button_message') {
          const button_id = data.message.button_reply.id

          const user = await getUserFromPhoneNumber(recipientPhone)

          if (!user) {
            await sendMessageToPhoneNumber(
              recipientPhone,
              `No tienes una billetera asociada a éste número. ¿Deseas crear una?`,
            )
          }

          switch (button_id) {
            case 'receive_money':
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Recibiendo dinero...',
              )
              break
            case 'send_money': {
              // const tx = await sendUsdtFromWallet({
              //   tokenAmount: 0.000001,
              //   toAddress: '0x060AE8C945bb01fa7e2833aDD65E00C87b2F49c1',
              //   privateKey: privateKey,
              // })

              const { id } = user

              const paymentRequest = await makePaymentRequest({
                amount: null,
                fromUserId: id,
                to: null,
              })

              await sendMessageToPhoneNumber(
                recipientPhone,
                `A quién deseas enviar dinero? ingresa el numero de celular de tu amigo o la dirección de su billetera \n ${JSON.stringify(
                  paymentRequest,
                )}`,
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
                'Acá tenés tu saldos!',
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
              await sendBasicTransactions()
              break
            }
            case 'create_wallet': {
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Creando tu billetera! 🔨',
              )

              const walletAddress = await createUser(
                recipientPhone,
                recipientName,
              )

              await sendMessageToPhoneNumber(
                recipientPhone,
                'Tu billetera ha sido creada! 🚀✨, tu dirección es:',
              )
              await sendSimpleButtonsMessage(recipientPhone, walletAddress, [
                { title: '¿Qué es una dirección?', id: 'info_address' },
              ])
              await sendSimpleButtonsMessage(
                recipientPhone,
                'Te comento que para transferir dinero ' +
                  'tenes que cargar BNB.',
                [{ title: '¿Qué es BNB?', id: 'info_bnb' }],
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
              await sendBasicTransactions()
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
