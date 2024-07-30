const mongoose = require('mongoose');

const serverConfigSchema = new mongoose.Schema({
  serverId: {
    type: String,
    required: true,
    unique: true,
  },
  reportChannelId: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('ServerConfig', serverConfigSchema);
