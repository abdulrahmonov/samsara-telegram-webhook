const express = require('express');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = '7683022635:AAH2JSnao2W1GSfwdniZG27qWfqKXvVP7hA';
const TELEGRAM_CHAT_ID = '-4601056436';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/samsara-alert', async (req, res) => {
  const alert = req.body;

  const message = `
🚨 *Samsara Alert*
Type: ${alert.alertType || 'N/A'}
Vehicle: ${alert.vehicleName || 'Unknown'}
Time: ${alert.timestamp || 'Unknown'}
Details: ${alert.description || JSON.stringify(alert)}
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
