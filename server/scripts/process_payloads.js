// server/scripts/process_payloads.js
// Usage: node scripts/process_payloads.js "C:\\temp\\whatsapp_payloads"
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('../models/Message');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/whatsapp';

async function main() {
  const payloadDir = process.argv[2];
  if (!payloadDir) {
    console.error('Usage: node scripts/process_payloads.js <payloads_dir>');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB for payload processing');

  const files = fs.readdirSync(payloadDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files in ${payloadDir}`);

  for (const file of files) {
    try {
      const full = path.join(payloadDir, file);
      const raw = fs.readFileSync(full, 'utf8');
      const payload = JSON.parse(raw);

      // try multiple shapes (entry -> changes -> value.messages OR top-level messages/statuses)
      const entries = payload.entry || (Array.isArray(payload) ? payload : [payload]);

      for (const entry of entries) {
        const changes = entry.changes || entry.change || [];
        const changeArr = Array.isArray(changes) ? changes : [changes];

        for (const change of changeArr) {
          const value = change.value || change || entry;

          // messages array (common pattern)
          const messages = value.messages || value.messages?.data || (Array.isArray(value) ? value : null);
          if (messages && Array.isArray(messages)) {
            for (const msg of messages) {
              const doc = {
                wa_id: msg.from || value.metadata?.phone_number_id || value.contacts?.[0]?.wa_id || msg.recipient_id || (msg.id ? msg.id.split('_')[0] : 'unknown'),
                conversation_id: msg.context?.id || value.metadata?.display_phone_number || msg.id || undefined,
                message_id: msg.id || msg.client_ref || msg._id || msg.message_id || (msg.id ? msg.id : undefined),
                meta_msg_id: msg.meta_msg_id || msg.id || undefined,
                from: msg.from || msg.sender || msg.author || '',
                to: value.metadata?.display_phone_number || msg.to || '',
                text: (msg.text && msg.text.body) ? msg.text.body : (msg.body || msg.text?.message || ''),
                timestamp: msg.timestamp ? new Date(Number(msg.timestamp) * 1000) : (msg.timestamp_ms ? new Date(Number(msg.timestamp_ms)) : new Date()),
                status: msg.status || 'sent',
                direction: (msg.from && value.metadata && value.metadata.display_phone_number && msg.from === value.metadata.display_phone_number) ? 'out' : (msg.direction || 'in'),
                raw_payload: payload
              };

              // upsert by message_id or meta_msg_id
              const filter = {};
              if (doc.message_id) filter.$or = [{ message_id: doc.message_id }, { meta_msg_id: doc.message_id }];
              else filter.$or = [{ meta_msg_id: doc.meta_msg_id }, { text: doc.text, timestamp: doc.timestamp }];

              await Message.findOneAndUpdate(filter, { $set: doc }, { upsert: true, new: true, setDefaultsOnInsert: true });
              console.log(`Processed message from file ${file} (${doc.message_id || doc.meta_msg_id || 'no-id'})`);
            }
          }

          // statuses
          const statuses = value.statuses || value.status || value.statuses?.data;
          if (statuses) {
            const stArr = Array.isArray(statuses) ? statuses : [statuses];
            for (const s of stArr) {
              const idToMatch = s.id || s.message_id || s.meta_msg_id || s.external_id;
              const statusVal = s.status || s.state || s.type;
              if (!idToMatch || !statusVal) continue;
              const updated = await Message.findOneAndUpdate(
                { $or: [{ message_id: idToMatch }, { meta_msg_id: idToMatch }] },
                { $set: { status: statusVal } },
                { new: true }
              );
              if (updated) console.log(`Updated status for ${idToMatch} => ${statusVal}`);
              else console.log(`No match for status id ${idToMatch}`);
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed processing', file, e.message);
    }
  }

  console.log('✅ Payload processing complete.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
