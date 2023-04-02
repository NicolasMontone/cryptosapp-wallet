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
  getAddressByPhoneNumber,
  getPrivateKeyByPhoneNumber,
  getUserFromPhoneNumber,
} from '../../lib/user'

import { createUser } from '../../lib/user'

import { getAccountBalances } from 'lib/crypto'
import {
  Address,
  PhoneNumber,
  addReceiverToPayment,
  cancelPaymentRequest,
  confirmPaymentRequest,
  getBscScanUrlForAddress,
  getRecipientAddressFromUncompletedPaymentRequest,
  isUserAwaitingAmountInput,
  isReceiverInputPending,
  makePaymentRequest,
  sendUsdtFromWallet,
  updatePaymentRequestToError,
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
            if (text && (await isReceiverInputPending(user.id))) {
              const receiver: PhoneNumber | Address = text.body

              try {
                console.log('receiver', {
                  user,
                  receiver,
                })
                const validatedReceiver = await addReceiverToPayment({
                  userId: user.id,
                  receiver,
                })
                await sendSimpleButtonsMessage(
                  recipientPhone,
                  `Cuántos USDT deseas enviar a ${validatedReceiver}?`,
                  [{ title: 'Cancelar transacción', id: 'cancel_send_money' }],
                )
                return
              } catch (error) {
                await sendSimpleButtonsMessage(
                  recipientPhone,
                  `El valor no es válido, fijate que cumpla con el formato de dirección o que el número de teléfono tenga cuenta con Cryptosapp \n ${error}`,
                  [{ title: 'Cancelar transacción', id: 'cancel_send_money' }],
                )
              }

              return
            }
            if (text && (await isUserAwaitingAmountInput(user.id))) {
              const amount = Number(text.body)

              try {
                await sendUsdtFromWallet({
                  tokenAmount: amount,
                  privateKey: await getPrivateKeyByPhoneNumber(recipientPhone),
                  toAddress:
                    await getRecipientAddressFromUncompletedPaymentRequest(
                      user.id,
                    ),
                })

                await confirmPaymentRequest({ userId: user.id, amount })

                const address = await getAddressByPhoneNumber(recipientPhone)

                await sendMessageToPhoneNumber(
                  recipientPhone,
                  'Pago exitoso! 🎉 Para mas informacion: 👇👇👇 ',
                )

                const bscScanUrl = getBscScanUrlForAddress(address)

                await sendMessageToPhoneNumber(recipientPhone, bscScanUrl)
              } catch (error) {
                await updatePaymentRequestToError(user.id)

                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `No se pudo realizar el pago 😢, 
                  ${error}`,
                )
              }
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

          switch (button_id) {
            case 'send_money': {
              if (!user) {
                throw new Error('Inesperadamente no se encontró el usuario')
              }

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
              const privateKey = await getPrivateKeyByPhoneNumber(
                recipientPhone,
              )

              const { bnbBalance, usdtBalance } = await getAccountBalances(
                privateKey,
              )

              await sendMessageToPhoneNumber(
                recipientPhone,
                '¡Acá tenés tu saldo!',
              )
              await sendMessageToPhoneNumber(
                recipientPhone,
                `${bnbBalance} BNB`,
              )
              await sendMessageToPhoneNumber(
                recipientPhone,
                `${usdtBalance} USDT`,
              )
              await sendMenuButtons()
              break
            }
            case 'check_address': {
              const address = await getAddressByPhoneNumber(recipientPhone)
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
                { title: 'Qué es?', id: 'info_address' },
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
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Para mas informacion mira este enlace:\nhttps://academy.binance.com/es/articles/what-is-bnb',
              )
              await sendMenuButtons()
              break
            case 'cancel_send_money':
              if (!user) {
                throw new Error('Inesperadamente no se encontró el usuario')
              }
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
