// server/routes/conversations.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET /conversations
// returns conversations grouped by wa_id with lastMessage, lastTimestamp, unreadCount
router.get('/', async (req, res) => {
  try {
    // Aggregate: group by wa_id (or conversation_id) and pick last message
    const agg = await Message.aggregate([
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$wa_id",
          wa_id: { $first: "$wa_id" },
          name: { $first: "$raw_payload.contactName" },
          number: { $first: "$from" },
          lastMessage: { $first: "$text" },
          lastTimestamp: { $first: "$timestamp" },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ["$direction", "in"] }, { $eq: ["$status", "sent"] }] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);

    // Normalize output
    const conversations = agg.map(c => ({
      wa_id: c.wa_id,
      name: c.name || c.wa_id,
      number: c.number || '',
      lastMessage: c.lastMessage || '',
      lastTimestamp: c.lastTimestamp,
      unreadCount: c.unreadCount || 0
    }));

    res.json(conversations);
  } catch (err) {
    console.error('conversations error', err);
    res.status(500).json({ error: 'Failed to fetch conversations', details: err.message });
  }
});

// GET /conversations/:wa_id -> messages for that wa_id
router.get('/:wa_id', async (req, res) => {
  try {
    const { wa_id } = req.params;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '100', 10);
    const skip = (page - 1) * limit;

    const messages = await Message.find({ $or: [{ wa_id }, { from: wa_id }, { to: wa_id }] })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.json(messages);
  } catch (err) {
    console.error('conversation messages error', err);
    res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
  }
});

module.exports = router;
