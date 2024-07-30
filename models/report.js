const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  code: { type: String, required: true },
  reportTitle: { type: String, required: true },
  reportDescription: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);
