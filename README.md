# Telegram Video Selling Bot 💖

This is a Node.js Telegraf bot designed to run a private video channel, track user crypto payments via TON, and send them videos on demand.

## Features
- **Wallet Polling:** Automatically tracks Toncoin payments to a specific wallet and matches them to users via memo/comment.
- **Auto Video Capture:** Listens to a private channel and captures new videos as `file_id`.
- **Sequential Video Delivery:** Sends videos sequentially and tracks sent videos to prevent duplicates.
- **Romantic Persona:** A fully consistent romantic, warm female persona.
- **JSON Storage & Logging:** Operates smoothly without a heavy database.

## Setup
1. Create a `.env` file based on `.env.example` and set your `BOT_TOKEN`.
2. Install dependencies: `npm install`
3. Run the bot: `npm start` (or `node index.js`)

## Testing (Simulated Payment)
You can test the bot without making real TON transactions:
1. Send `/start` to your bot.
2. Send `/test_flow` to give yourself 2 fake videos as balance.
3. Send a Video file to a Private Channel where the bot is an Admin.
4. Go back to the bot and send `/get_video`. You should receive the video!
