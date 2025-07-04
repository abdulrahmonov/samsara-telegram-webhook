const express = require('express');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7683022635:AAH2JSnao2W1GSfwdniZG27qWfqKXvVP7hA';
const TELEGRAM_CHAT_ID = '-4601056436';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/samsara-alert', async (req, res) => {
  const body = req.body;

  // Default values
  let alertType = body.eventType || body.event?.eventType || 'Unknown Type';
  let vehicleName = body.vehicleName || body.event?.vehicleName || 'Unknown Vehicle';
  let timestamp = body.timestamp || body.eventMs || 'Unknown Time';

  // Prepare readable timestamp if it's in milliseconds
  if (typeof timestamp === 'number') {
    const date = new Date(timestamp);
    timestamp = date.toISOString();
  }

  // Create readable message
  let details;
  try {
    details = body.description || JSON.stringify(body.event || body, null, 2);
  } catch {
    details = 'Could not parse event details.';
  }

  const message = `
🚨 *Samsara Alert*
*Type*: ${alertType}
*Vehicle*: ${vehicleName}
*Time*: ${timestamp}
*Details*: \`${details}\`
  `;

  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown'
    });

    res.status(200).send('Alert sent to Telegram.');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Error sending alert to Telegram.');
  }
});

app.get('/', (req, res) => {
  res.send('Samsara Telegram Webhook is running!');
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
