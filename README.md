### Check it out

Our page:
https://pybalt.github.io/cryptosapp-landing/

The chatbot:
https://api.whatsapp.com/send?phone=5491173603358&text=Cuentame

Or you can scan our QR Code!

<img src="https://user-images.githubusercontent.com/96897286/229319909-27b75d32-23f9-4a27-8c35-8715b45c29f2.png" height = "300px"/>

### Run it in local

You should have installed `vercel-cli`

- Setup you project in vercel adding the env variables of the `.env.example`
- run 
```bash
npm run start
```
and this will populate your env variables and deploy a lambda function poiting to your local environment. 

### Endpoints

this project is composed of lambdas deployed in Vercel, with the following endpoints

- `/whatsapp` this endpoints listens to whatsapp API notifications, each time a message is sent, this enpoint is called
  _ `GET` method is used for the challenge, to validate when creating webhook from facebook dashboard
  _ `POST` is used for receiving notifications. Notifications are then redirected to `/whatsapp/message` to answer quickly to the request and asynchronously handling all side effects

      # Set up

  in `.env.example` you'll se all environment variables needed for the project

To configure the project, you'll need to set up

- whatsapp bussiness acount
- an application in `developers.facebook.com`

### Whatsapp and Meta accounts
1. Go to [facebook's business dashboard](https://business.facebook.com/), log in and create a new bussiness account. You can do this by clicking in the account's dropdown in the top-left and clicking `Create new business account` and enter all the data requested.
2. Now go to [Accounts / Whatsapp accounts](https://business.facebook.com/settings/whatsapp-business-accounts/) and click in `Add` and enter a phone number. This has to be a phone number **without** a personal whatsapp account already registered. Copy the phone number in the env variable `WA_BUSSINESS_PHONE_NUMBER`(5) without "+". i.e `+54 9 11 24080127` would be `5491124080126` for an argentine number. Note the `9` is added.
3. Go to `developers.facebook.com` and register a facebook developer account if you don't have one already from your personal facebook account (you'll just need to accept terms and conditions)
4. in `https://developers.facebook.com/apps` go to `Create App`, select `Bussiness`, enter a name for your application and select you bussiness account you just created in the dropdown.
5. Click on "Set up" in the Whatsapp product, and then click on the "Start using the API" blue button.
6. In the "Send and receive messages" section, in the "From" dropdown, you should be able to see the phone you configured in the previous step, select it and copy the "Phone number ID", this will be set in the environment variable `META_WA_SENDER_PHONE_NUMBER_ID`(6). Also besides that, you should be able to see "WhatsApp Business Account ID". You'll copy this value and set it to the env `META_WA_WABA_ID`(7)
7. Now we'll generate the access token to send messages from our api. In whatsapp business dashboard, go to [System users](https://business.facebook.com/settings/system-users). here click on `Add`, set a name and set "Admin" as role. Now click on `Add Assets` to the user. Select the `Apps` tab and select the app you recently created. Toggle the "Manage app" to give total access switch to give all permissions, and save.
8. Now click on `Generate new token`, select the app, and check this permissions:
	* `bussiness_management`
	* `whatsapp_business_messaging`
	* `whatsapp_business_management`
and click on create token.
9. Copy the access token in the `META_WA_ACCESS_TOKEN`(8) variable
10. In [facebook developers dashboard](https://developers.facebook.com/apps) select you application and in the side bar, look for `Configuration` in the Whatsapp section. Here You'll see a "Webhooks" section.
11. Click `Edit`. Here you'll be prompted to enter a callback url. This will be the url the API is deployed on, wich will also be `https://{VERCEL_PROD_URL}/api/whatsapp`, and in the verify token field set a custom password you want, and also set it in `META_WA_VERIFY_TOKEN`(9). If your API is running, you'll be able to solve the challenge and the webhook will be created.
