import { VercelRequestCookies, VercelRequestQuery } from '@vercel/node'

import { IncomingMessage } from 'http'

export type WhatsappNewMessageEventNotificationRequest = IncomingMessage & {
  query: VercelRequestQuery
  cookies: VercelRequestCookies
  body: WhatsappNewMessageEventNotificationBody
}

export type WhatsappNewMessageEventNotificationBody = {
  object: string
  entry: Entry[]
}

export type Entry = {
  id: string
  changes: Change[]
}

export type Change = {
  value: Value
  field: string
}

export type Value = {
  messaging_product: string
  metadata: Metadata
  contacts: Contact[]
  messages: Message[]
}

export type Contact = {
  profile: Profile
  wa_id: string
}

export type Profile = {
  name: string
}

export type Message = {
  from: string
  id: string
  timestamp: string
  text: Text
  type: string
}

export type Text = {
  body: string
}

export type Metadata = {
  display_phone_number: string
  phone_number_id: string
}

export type WhatsappParsedMessage = {
  isMessage: boolean
  message: {
    from: {
      phone: string
      name: string
    }
    timestamp: string
    text?: { body: string }
    type: string
    message_id: string
    list_reply: {
      id: string
    }
    button_reply: {
      id: string
    }
  }
}
