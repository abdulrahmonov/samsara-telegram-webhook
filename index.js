// index.js
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

  // Try to extract unit number
  const unitNumber =
    body.vehicle?.externalIds?.unitNumber ||
    body.event?.vehicle?.externalIds?.unitNumber ||
    body.data?.conditions?.[0]?.details?.harshEvent?.vehicle?.externalIds?.unitNumber ||
    body.data?.conditions?.[0]?.details?.harshEvent?.vehicle?.name ||
    body.data?.conditions?.[0]?.details?.harshEvent?.vehicleName?.match(/\d{4}/)?.[0] ||
    'unknown';

  const chatId = groupMap[unitNumber] || DEFAULT_GROUP_CHAT_ID;

  const alertType =
    body.eventType ||
    body.event?.eventType ||
    body.event?.text ||
    body.data?.conditions?.[0]?.description ||
    'Unknown Type';

  let timestamp =
    body.timestamp ||
    body.eventMs ||
    body.eventTime ||
    body.data?.happenedAtTime ||
    Date.now();
  if (typeof timestamp === 'number') {
    timestamp = new Date(timestamp).toISOString();
  }

  const vehicleName =
    body.vehicle?.name ||
    body.event?.vehicle?.name ||
    body.data?.conditions?.[0]?.details?.harshEvent?.vehicle?.name ||
    unitNumber;

  // Check if it's a fault code alert
  let faultInfo = '';
  const condition = body.data?.conditions?.[0];
  if (condition?.details?.harshEvent?.vehicle) {
    // It's a harsh event or similar
    faultInfo = JSON.stringify(condition.details, null, 2);
  } else if (condition?.description?.toLowerCase().includes('fault')) {
    const faults = body.data.conditions.map((c) => {
      const d = c.details?.faultCode || {};
      return `*Severity:* ${c.severity || 'Unknown'}\n*SPN:* ${d.spn || 'N/A'} – ${d.description || 'No Description'}\n*FMI:* ${d.fmi || 'N/A'}\n*Count:* ${d.count || 'N/A'}`;
    }).join('\n\n');
    faultInfo = faults;
  } else {
    faultInfo = JSON.stringify(body.event?.details || body.data || body, null, 2);
  }

  const message = `
🚨 *Samsara Alert*
*Type:* ${alertType}
*Vehicle:* ${vehicleName}
*Time:* ${timestamp}
*Unit #:* ${unitNumber}
*Details:*
\n\`\`\`
${faultInfo}
\`\`\`
`.trim();

  const sendMessage = async (chatId) => {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });
  };

  try {
    await sendMessage(chatId);

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
