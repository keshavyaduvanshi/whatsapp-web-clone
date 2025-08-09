// server/models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  wa_id: { type: String, required: true },
  conversation_id: { type: String },
  message_id: { type: String, unique: true, required: true },
  meta_msg_id: { type: String },
  from: { type: String },
  to: { type: String },
  text: { type: String },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['sent','delivered','read'], default: 'sent' },
  direction: { type: String, enum: ['in','out'], default: 'in' },
  raw_payload: { type: Object }
}, { collection: 'processed_messages' }); // force use processed_messages

module.exports = mongoose.model('Message', messageSchema);
