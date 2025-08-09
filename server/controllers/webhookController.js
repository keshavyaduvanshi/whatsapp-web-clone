const Message = require('../models/Message');

const receiveWebhook = async (req, res) => {
  const payload = req.body;
  // Process the payload and save to DB
  // Logic to handle incoming webhook payloads
  res.status(200).send('Webhook received');
};

const processLocalPayloads = async (req, res) => {
  // Logic to process local JSON files
  res.status(200).send('Local payloads processed');
};

module.exports = { receiveWebhook, processLocalPayloads };
