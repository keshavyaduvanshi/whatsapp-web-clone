// server/routes/messages.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { v4: uuidv4 } = require('uuid');

// POST /messages -> create a demo outgoing message (saved only)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const doc = {
      wa_id: payload.wa_id || payload.to || payload.from,
      conversation_id: payload.conversation_id || null,
      message_id: payload.message_id || uuidv4(),
      meta_msg_id: payload.meta_msg_id || null,
      from: payload.from || (payload.wa_id ? payload.wa_id : 'me'),
      to: payload.to || '',
      text: payload.text || '',
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      status: payload.status || 'sent',
      direction: payload.direction || 'out',
      raw_payload: payload
    };
    const m = await Message.create(doc);
    // emit via socket
    const io = req.app.get('io');
    if (io) io.emit('new_message', m);
    res.status(201).json(m);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /messages -> list all messages or query by wa_id
router.get('/', async (req, res) => {
  try {
    const wa_id = req.query.wa_id;
    const filter = wa_id ? { wa_id } : {};
    const msgs = await Message.find(filter).sort({ timestamp: 1 }).lean();
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
