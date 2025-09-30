
const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  filename: { type: String },
  totalItems: { type: Number, default: 0 },
  agents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Agent' }], // agents used for distribution
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Batch', BatchSchema);
