const express = require('express');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7683022635:AAH2JSnao2W1GSfwdniZG27qWfqKXvVP7hA';

// Map unit numbers to Telegram group chat IDs
const groupMap = {
  '2013': '-4891280909',
  '1003': '-1002274891665',
  '4768': '-4883947957'
};

const DEFAULT_GROUP_CHAT_ID = '-4601056436'; // main alerts group

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/samsara-alert', async (req, res) => {
  const body = req.body;

  // Extract unit number
  const unitNumber =
    body.vehicle?.externalIds?.unitNumber ||
    body.event?.vehicle?.externalIds?.unitNumber ||
    body.event?.vehicleName?.match(/\d{4}/)?.[0] ||
    'unknown';

  const chatId = groupMap[unitNumber] || DEFAULT_GROUP_CHAT_ID;

  // Format fields
  const alertType =
    body.eventType || body.event?.eventType || body.event?.text || 'Unknown Type';

  let timestamp = body.timestamp || body.eventMs || Date.now();
  if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp).toISOString();
  }

  const vehicleName =
    body.vehicle?.name ||
    body.event?.vehicle?.name ||
    body.event?.vehicleName ||
    unitNumber ||
    'Unknown Vehicle';

  const details = JSON.stringify(
    body.event?.details || body.event || body,
    null,
    2
  );

  const message = `
🚨 *Samsara Alert*
*Type:* ${alertType}
*Vehicle:* ${vehicleName}
*Time:* ${timestamp}
*Unit #:* ${unitNumber}
*Details:*
\`\`\`
${details}
\`\`\`
  `;

  const sendMessage = async (chatId) => {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
  };

  try {
    // Send to unit-specific group
    await sendMessage(chatId);

    // Always send to main alerts group (unless it's already the same)
    if (chatId !== DEFAULT_GROUP_CHAT_ID) {
      await sendMessage(DEFAULT_GROUP_CHAT_ID);
    }

    res.status(200).send('Alert sent to Telegram.');
  } catch (err) {
    console.error('Telegram Error:', err.response?.data || err.message);
    res.status(500).send('Error sending alert to Telegram.');
  }
});

app.get('/', (req, res) => {
  res.send('Samsara Telegram Webhook is running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
