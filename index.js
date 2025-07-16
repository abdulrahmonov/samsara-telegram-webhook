const express = require('express');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7683022635:AAH2JSnao2W1GSfwdniZG27qWfqKXvVP7hA';
const MAIN_GROUP_CHAT_ID = '-4601056436'; // your main Telegram group

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/samsara-alert', async (req, res) => {
  const body = req.body;

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
    'Unknown Vehicle';

  const unitNumber =
    body.vehicle?.externalIds?.unitNumber ||
    body.event?.vehicle?.externalIds?.unitNumber ||
    vehicleName || 'unknown';

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

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: MAIN_GROUP_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });

    res.status(200).send('Alert sent to main Telegram group.');
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
