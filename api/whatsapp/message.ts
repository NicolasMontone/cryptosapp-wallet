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
  getRecipientUserFromUncompletedPaymentRequest,
  isReceiverInputPending,
  isUserAwaitingAmountInput,
  makePaymentRequest,
  sendUsdtFromWallet,
  updatePaymentRequestToError,
} from '../../lib/crypto/transaction'

async function sendMenuButtonsTo(phoneNumber: string) {
  await sendSimpleButtonsMessage(phoneNumber, 'Qué querés hacer?', [
    { title: 'Ingresar dinero', id: 'check_address' },
    { title: 'Enviar dinero 💸', id: 'send_money' },
    { title: 'Consultar saldo 🔎', id: 'check_balance' },
  ])
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
      const {
        message: {
          from: { phone: recipientPhone, name: recipientName },
          type: typeOfMessage,
          message_id: messageId,
          text,
        },
      } = data
      const sendMenuButtons = async () => {
        sendMenuButtonsTo(recipientPhone)
      }
      try {
        if (typeOfMessage === 'text_message') {
          const user = await getUserFromPhoneNumber(recipientPhone)

          if (user) {
            if (text && (await isReceiverInputPending(user.id))) {
              const receiver: PhoneNumber | Address = text.body

              try {
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
                const recipientUser =
                  await getRecipientUserFromUncompletedPaymentRequest(user.id)

                if (!recipientUser) {
                  throw new Error('No se pudo encontrar el usuario')
                }

                const senderPrivateKey = await getPrivateKeyByPhoneNumber(
                  recipientPhone,
                )

                await sendUsdtFromWallet({
                  tokenAmount: amount,
                  privateKey: senderPrivateKey,
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

                await sendMessageToPhoneNumber(
                  recipientUser.phoneNumer,
                  `Recibiste ${amount} USDT de ${user.name} 🌟`,
                )
                await sendMenuButtonsTo(recipientUser.phoneNumer)

                const bscScanUrl = getBscScanUrlForAddress(address)

                await sendMessageToPhoneNumber(recipientPhone, bscScanUrl)
              } catch (error) {
                await updatePaymentRequestToError(user.id)

                await sendMessageToPhoneNumber(
                  recipientPhone,
                  `No se pudo realizar el pago 😢`,
                )

                await sendMessageToPhoneNumber(recipientPhone, error)
              }
              return
            }

            await sendMessageToPhoneNumber(
              recipientPhone,
              `Hola de nuevo${recipientName ? ` ${recipientName}` : ''}! 👋`,
            )
            await sendMenuButtons()
          } else {
            await sendMessageToPhoneNumber(
              recipientPhone,
              `Hola ${recipientName}! 👋`,
            )
            await sendMessageToPhoneNumber(
              recipientPhone,
              `Soy tu crypto-bot 🤖 favorito.\nTu servicio de billetera digital más seguro, confiable y fácil de usar.`,
            )
            await sendSimpleButtonsMessage(
              recipientPhone,
              'Veo que no tenés una billetera asociada a éste número. Querés crear una?',
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
                `A quién deseas enviar dinero?`,
              )

              await sendSimpleButtonsMessage(
                recipientPhone,
                `Ingresá el número de celular o la dirección de la billetera de destino`,
                [
                  {
                    title: 'Cancelar',
                    id: 'cancel_send_money',
                  },
                ],
              )

              break
            }
            case 'check_balance': {
              await sendMessageToPhoneNumber(recipientPhone, 'Cargando ⏳')

              const privateKey = await getPrivateKeyByPhoneNumber(
                recipientPhone,
              )

              const { bnbBalance, usdtBalance } = await getAccountBalances(
                privateKey,
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
              await sendMessageToPhoneNumber(recipientPhone, 'Cargando ⏳')
              const address = await getAddressByPhoneNumber(recipientPhone)
              await sendMessageToPhoneNumber(
                recipientPhone,
                'Para ingresar dinero, tenés que enviarlo a esta dirección:',
              )
              await sendMessageToPhoneNumber(recipientPhone, address)
              await sendMessageToPhoneNumber(
                recipientPhone,
                '(Enviá USDT por red Binance Smart Chain)',
              )
              await sendMenuButtons()
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
                'Tu billetera fue creada! 🚀✨\n tu dirección es:',
              )
              await sendSimpleButtonsMessage(recipientPhone, walletAddress, [
                { title: 'Qué es?', id: 'info_address' },
              ])

              await sendMenuButtons()

              break
            }
            case 'info_address': {
              sendSimpleButtonsMessage(
                recipientPhone,
                'Una dirección es como un número de cuenta bancaria que podés usar para recibir dinero de otras personas. En este caso la billetera usa la red Binance Smart Chain, y soporta la criptomoneda USDT. Para hacer transferencias vas a necesitar BNB',
                [{ title: 'Qué es BNB?', id: 'info_bnb' }],
              )

              await sendMenuButtons()

              break
            }
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
          `🔴 Ha ocurrido un error: ${JSON.stringify(
            error,
            Object.getOwnPropertyNames(error),
          )}`,
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
