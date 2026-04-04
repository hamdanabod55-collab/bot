require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const store = require('./store');
const { logAction } = require('./logger');
const messages = require('./messages');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
   console.warn("WARNING: BOT_TOKEN is not set in .env.");
}

const bot = new Telegraf(BOT_TOKEN || 'fake_token');

// Middleware to ensure user exists
bot.use((ctx, next) => {
  if (ctx.from && !ctx.from.is_bot) {
    const user = store.getUser(ctx.from.id.toString());
    if (user.username === '') {
      store.updateUser(ctx.from.id.toString(), { username: ctx.from.username || 'unknown' });
    }
  }
  return next();
});

bot.start((ctx) => {
  const telegramId = ctx.from.id.toString();
  logAction('COMMAND_START', telegramId);
  ctx.reply(messages.welcome);
});

bot.command('balance', (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = store.getUser(telegramId);
  logAction('COMMAND_BALANCE', telegramId);
  
  const msg = messages.balance_check.replace('{balance}', user.balance);
  ctx.replyWithMarkdown(msg, Markup.inlineKeyboard([
      [Markup.button.callback('سحب TON 💸', 'withdraw_ton')]
  ]));
});

bot.action('withdraw_ton', (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = store.getUser(telegramId);
    logAction('ACTION_WITHDRAW_TON', telegramId);

    if (user.balance <= 0) {
        return ctx.answerCbQuery('ليس لديك رصيد كافي للسحب يا روحي!', { show_alert: true });
    }

    // Dummy deduct all stars logically
    store.updateUser(telegramId, {
        balance: 0
    });

    ctx.answerCbQuery('تم إرسال طلب السحب بنجاح 😘', { show_alert: false });
    ctx.reply(messages.withdraw_ton_success);
});

bot.command('pay', (ctx) => {
  const telegramId = ctx.from.id.toString();
  logAction('COMMAND_PAY', telegramId);
  
  ctx.replyWithMarkdown(messages.pay_instructions, Markup.inlineKeyboard([
      [Markup.button.callback('اشترِ 5 نجوم (5 فيديوهات) ✨', 'buy_5')],
      [Markup.button.callback('اشترِ 10 نجوم (10 فيديوهات) 💫', 'buy_10')]
  ]));
});

// Helper for sending Invoice
async function sendInvoice(ctx, starsAmount) {
  const invoice = {
      title: `شراء ${starsAmount} نجوم`,
      description: `شحن رصيد الفيديوهات الرومانسية بـ ${starsAmount} نجوم 😘`,
      payload: `buy_${starsAmount}_stars`,
      provider_token: "", // Must be empty for Telegram Stars
      currency: "XTR",
      prices: [{ label: `نجوم`, amount: starsAmount }]
  };
  await ctx.replyWithInvoice(invoice);
}

bot.action('buy_5', (ctx) => {
    ctx.answerCbQuery();
    sendInvoice(ctx, 5);
});

bot.action('buy_10', (ctx) => {
    ctx.answerCbQuery();
    sendInvoice(ctx, 10);
});

// Pre-checkout
bot.on('pre_checkout_query', (ctx) => {
    ctx.answerPreCheckoutQuery(true);
});

// Successful payment
bot.on('successful_payment', (ctx) => {
    const telegramId = ctx.from.id.toString();
    const payment = ctx.message.successful_payment;
    // Telegram Stars amount is directly equal to the total_amount (which is in minimum unit of XTR, so 1 star = 1)
    const starsAdded = payment.total_amount;
    
    const user = store.getUser(telegramId);
    store.updateUser(telegramId, {
        balance: user.balance + starsAdded
    });

    logAction('STARS_PAYMENT_RECEIVED', telegramId, { starsAdded });

    const msg = messages.payment_received.replace('{stars}', starsAdded);
    ctx.replyWithMarkdown(msg);
});

bot.command('get_video', async (ctx) => {
  const telegramId = ctx.from.id.toString();
  const user = store.getUser(telegramId);
  logAction('COMMAND_GET_VIDEO', telegramId);
  
  if (user.balance <= 0) {
    return ctx.reply(messages.empty_balance);
  }

  const unseenVideo = store.getUnseenVideoForUser(telegramId);
  if (!unseenVideo) {
    return ctx.reply(messages.error_duplicate_video);
  }

  // Deduct balance and add to received
  const newBalance = user.balance - 1;
  const newReceived = [...user.videosReceived, unseenVideo];
  store.updateUser(telegramId, {
    balance: newBalance,
    videosReceived: newReceived
  });

  try {
    await ctx.replyWithDocument(unseenVideo);
    
    const msg = messages.video_sent.replace('{balance}', newBalance);
    await ctx.replyWithMarkdown(msg);
    logAction('VIDEO_SENT', telegramId, { fileId: unseenVideo });
  } catch (error) {
    console.error('Failed to send document', error);
    store.updateUser(telegramId, {
      balance: user.balance, 
      videosReceived: user.videosReceived 
    });
    ctx.reply(messages.error_generic);
  }
});

// Hidden Command for Flow Testing
bot.command('test_flow', (ctx) => {
   const telegramId = ctx.from.id.toString();
   const user = store.getUser(telegramId);
   store.updateUser(telegramId, {
      balance: user.balance + 2
   });
   ctx.reply('Simulated payment of 2 فيديوهات. Check your balance using /balance.');
});

// Channel listener
bot.on('channel_post', (ctx) => {
  const post = ctx.channelPost;
  if (post.video || post.document) {
    let fileId = null;
    if (post.video) fileId = post.video.file_id;
    else if (post.document && post.document.mime_type && post.document.mime_type.startsWith('video/')) {
       fileId = post.document.file_id;
    }

    if (fileId) {
      const added = store.addVideo(fileId);
      if (added) {
         console.log(`New video captured from channel! File ID: ${fileId}`);
      }
    }
  }
});

if (BOT_TOKEN) {
   bot.launch().then(() => {
     console.log('Bot is running...');
   }).catch(err => console.error('Failed to launch bot:', err));
   process.once('SIGINT', () => bot.stop('SIGINT'));
   process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

