// server/routes/webhook.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Endpoint for webhook verification (GET) and POST
// GET used by Meta to verify: ?hub.mode=subscribe&hub.challenge=TOKEN&hub.verify_token=ABC
router.get('/', (req, res) => {
  const VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'verify_token';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verified');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  res.sendStatus(200);
});

router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    // Basic save of raw payload and attempt to extract messages (simple)
    // If payload has messages array like payload.entry[].changes[].value.messages
    const entries = payload.entry || [payload];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value || change;
        if (value.messages && Array.isArray(value.messages)) {
          for (const msg of value.messages) {
            const doc = {
              wa_id: msg.from || value.metadata?.phone_number_id,
              conversation_id: msg.id || msg.context?.id || null,
              message_id: msg.id || msg.message_id || msg.id,
              meta_msg_id: msg.id,
              from: msg.from || '',
              to: value.metadata?.display_phone_number || '',
              text: (msg.text && msg.text.body) ? msg.text.body : (msg.body || ''),
              timestamp: msg.timestamp ? new Date(Number(msg.timestamp)*1000) : new Date(),
              status: 'sent',
              direction: msg.from === (value.metadata?.display_phone_number) ? 'out' : 'in',
              raw_payload: payload
            };
            await Message.create(doc);
            // If sockets are enabled, emit event
            const io = req.app.get('io');
            if (io) io.emit('new_message', doc);
          }
        }

        // statuses
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const s of value.statuses) {
            const idToMatch = s.id || s.message_id || s.meta_msg_id;
            const statusVal = s.status;
            if (!idToMatch) continue;
            await Message.findOneAndUpdate(
              { $or: [{ message_id: idToMatch }, { meta_msg_id: idToMatch }] },
              { status: statusVal },
              { new: true }
            );
            const io = req.app.get('io');
            if (io) io.emit('status_update', { id: idToMatch, status: statusVal });
          }
        }
      }
    }

    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook processing error', err);
    res.status(500).send('error');
  }
});

module.exports = router;
