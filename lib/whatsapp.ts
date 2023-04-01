import WhatsappCloudAPI from 'whatsappcloudapi_wrapper'

export const Whatsapp = new WhatsappCloudAPI({
  accessToken: process.env.META_WA_ACCESS_TOKEN,
  senderPhoneNumberId: process.env.META_WA_SENDER_PHONE_NUMBER_ID,
  WABA_ID: process.env.META_WA_WABA_ID,
})

/**
 * Send a simple message to user
 * @param recipientPhone
 * @param message
 */
export async function sendMessageToPhoneNumber(
  recipientPhone: string,
  message: string,
): Promise<void> {
  await Whatsapp.sendText({
    recipientPhone,
    message,
  })
}

/**
 * Send a simple buttons messages
 * @param recipientPhone
 * @param message
 * @param buttons
 */
export async function sendSimpleButtonsMessage(
  recipientPhone: string,
  message: string,
  buttons: {
    title: string
    id: string
  }[],
): Promise<void> {
  await Whatsapp.sendSimpleButtons({
    recipientPhone,
    message,
    listOfButtons: buttons,
  })
}
