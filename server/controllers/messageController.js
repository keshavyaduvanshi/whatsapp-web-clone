// server/controllers/messageController.js
const Message = require('../models/Message');
const { v4: uuidv4 } = require('uuid');

const createMessage = async (req, res) => {
  try {
    const { wa_id, to, from, text, direction, message_id, conversation_id, raw_payload } = req.body;

    // Build a safe message object; generate message_id if not provided
    const msg = new Message({
      wa_id: wa_id || to || from,
      to: to || wa_id || from || '',
      from: from || wa_id || '',
      text: text || '',
      direction: direction || (from ? 'in' : 'out'),
      message_id: message_id || uuidv4(),
      conversation_id: conversation_id || undefined,
      raw_payload: raw_payload || undefined,
      status: 'sent',
      timestamp: new Date()
    });

    const saved = await msg.save();

    // emit via socket if available
    const io = req.app.get('io');
    if (io) io.emit('new_message', saved);

    res.status(201).json(saved);
  } catch (err) {
    console.error('createMessage error:', err);
    // if duplicate key on message_id, still return the existing doc
    if (err.code === 11000 && err.keyValue && err.keyValue.message_id) {
      const existing = await Message.findOne({ message_id: err.keyValue.message_id });
      return res.status(200).json(existing);
    }
    res.status(500).json({ error: 'Failed to create message', details: err.message });
  }
};

const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params; // here `id` is MongoDB _id
    const { status } = req.body;
    if (!['sent', 'delivered', 'read'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updated = await Message.findByIdAndUpdate(id, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Message not found' });

    const io = req.app.get('io');
    if (io) io.emit('status_update', { message_id: updated.message_id || updated._id, status });

    res.json(updated);
  } catch (err) {
    console.error('updateMessageStatus error:', err);
    res.status(500).json({ error: 'Failed to update status', details: err.message });
  }
};

module.exports = { createMessage, updateMessageStatus };
