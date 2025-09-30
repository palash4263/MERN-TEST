const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  firstName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  notes: { type: String, trim: true },
  originalIndex: { type: Number }, // preserves CSV row order
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
