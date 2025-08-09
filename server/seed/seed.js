const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

const seedMessages = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const messages = [
    // Sample messages
  ];
  await Message.insertMany(messages);
  console.log('Database seeded!');
  mongoose.connection.close();
};

seedMessages();
