// backend/routes/distributions.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const xlsx = require('xlsx');
const Agent = require('../models/Agent');
const Task = require('../models/Task');
const Batch = require('../models/Batch');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

const ALLOWED_EXT = ['.csv', '.xls', '.xlsx', '.axls']; // treat 'axls' as alias if present

function extFromName(name = '') {
  const m = name.toLowerCase().match(/\.[^\.]+$/);
  return m ? m[0] : '';
}

/**
 * Normalize header key: remove spaces, lowercase
 */
function normKey(k) {
  return String(k || '').replace(/\s+/g, '').toLowerCase();
}

/**
 * Map row object to required fields: FirstName, Phone, Notes (case-insensitive)
 * Accepts flexible header names (FirstName | First Name | firstname)
 */
function mapRowToFields(row) {
  // row keys might be original headers or numeric indexes (if parsed from CSV without headers)
  const mapped = { firstName: '', phone: '', notes: '' };
  // check keys
  for (const rawKey of Object.keys(row)) {
    const n = normKey(rawKey);
    if (['firstname', 'first_name', 'fname', 'name'].includes(n)) {
      mapped.firstName = String(row[rawKey]).trim();
      continue;
    }
    if (['phone', 'phonenumber', 'mobilenumber', 'mobile'].includes(n)) {
      mapped.phone = String(row[rawKey]).trim();
      continue;
    }
    if (['notes', 'note', 'description'].includes(n)) {
      mapped.notes = String(row[rawKey]).trim();
      continue;
    }
    // if header matches exactly like 'first' or so, ignore
  }
  return mapped;
}

/**
 * POST /api/distributions/upload
 * multipart/form-data: file field 'file'
 * Behavior:
 *  - Validate extension
 *  - Parse rows
 *  - Validate there is at least FirstName & Phone columns
 *  - Fetch 5 agents from DB (first 5 by createdAt asc). If fewer than 5 agents exist, returns error.
 *  - Distribute rows equally among 5 agents, remainder in order.
 *  - Save Batch and Task documents.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const originalName = req.file.originalname || 'upload';
    const ext = extFromName(originalName);
    if (!ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ success: false, message: 'Invalid file type. Allowed: .csv, .xls, .xlsx' });
    }

    // Parse file into rows array of objects
    let rows = [];
    if (ext === '.csv') {
      const content = req.file.buffer.toString('utf8');
      // parse with header: true
      const records = parse(content, { columns: true, skip_empty_lines: true, trim: true });
      rows = records;
    } else {
      // .xls or .xlsx or axls
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const records = xlsx.utils.sheet_to_json(sheet, { defval: '' });
      rows = records;
    }

    if (!rows || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Uploaded file contains no rows' });
    }

    // Map rows to required fields and validate presence
    const mappedRows = rows.map((r, idx) => {
      const mapped = mapRowToFields(r);
      return { ...mapped, originalIndex: idx };
    });

    // ensure at least FirstName and Phone present for first row (simple validation)
    const missing = mappedRows.some((r) => !r.firstName || !r.phone);
    if (missing) {
      return res.status(400).json({
        success: false,
        message:
          'CSV validation failed: ensure each row has FirstName and Phone columns. Header names accepted: FirstName / First Name, Phone / Mobile, Notes.'
      });
    }

    // Fetch 5 agents from DB (choose first 5 ordered by createdAt ascending)
    const agents = await Agent.find({}).sort({ createdAt: 1 }).limit(5).lean();
    if (!agents || agents.length < 5) {
      return res.status(400).json({ success: false, message: 'Need at least 5 agents in DB to distribute tasks. Add agents first.' });
    }

    // Distribution algorithm
    const total = mappedRows.length;
    const base = Math.floor(total / 5);
    const remainder = total % 5; // first `remainder` agents get +1

    // Build array with counts per agent
    const counts = new Array(5).fill(base);
    for (let i = 0; i < remainder; i++) counts[i]++;

    // Assign items sequentially preserving order
    const tasksToSave = [];
    let cursor = 0;
    for (let ai = 0; ai < 5; ai++) {
      const agentId = agents[ai]._id;
      const assignCount = counts[ai];
      for (let j = 0; j < assignCount; j++) {
        const row = mappedRows[cursor];
        tasksToSave.push({
          agent: agentId,
          firstName: row.firstName,
          phone: row.phone,
          notes: row.notes,
          originalIndex: row.originalIndex
        });
        cursor++;
      }
    }

    // Create Batch and save tasks in bulk
    const batch = new Batch({
      filename: originalName,
      totalItems: total,
      agents: agents.map((a) => a._id)
    });
    await batch.save();

    // attach batch id to tasks
    const tasksWithBatch = tasksToSave.map((t) => ({ ...t, batch: batch._id }));

    // Bulk insert tasks
    await Task.insertMany(tasksWithBatch);

    return res.status(201).json({
      success: true,
      message: 'File uploaded and tasks distributed',
      batchId: batch._id,
      total,
      perAgentCounts: counts,
      agents: agents.map((a, idx) => ({ id: a._id, name: a.name, email: a.email, assigned: counts[idx] }))
    });
  } catch (err) {
    console.error('Distribute upload error:', err);
    return res.status(500).json({ success: false, message: 'Server error during upload' });
  }
});

/**
 * GET /api/distributions
 * Returns agents and their tasks (latest batch by default)
 * Query:
 *  - batchId (optional) to fetch specific batch
 */
router.get('/', async (req, res) => {
  try {
    const batchId = req.query.batchId;

    // If batchId provided, use it; otherwise get latest batch
    let batch;
    if (batchId) {
      batch = await Batch.findById(batchId).lean();
      if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    } else {
      batch = await Batch.findOne({}).sort({ createdAt: -1 }).lean();
      if (!batch) return res.status(404).json({ success: false, message: 'No batches found' });
    }

    // Fetch agents (populate basic info)
    const agents = await Agent.find({ _id: { $in: batch.agents } }).lean();

    // Fetch tasks grouped by agent
    const tasks = await Task.find({ batch: batch._id }).select('-__v').lean();

    const tasksByAgent = {};
    for (const a of agents) tasksByAgent[a._id.toString()] = [];

    for (const t of tasks) {
      const aid = (t.agent || '').toString();
      if (!tasksByAgent[aid]) tasksByAgent[aid] = [];
      tasksByAgent[aid].push({
        id: t._id,
        firstName: t.firstName,
        phone: t.phone,
        notes: t.notes,
        originalIndex: t.originalIndex
      });
    }

    // Build response per agent preserving agents order from batch.agents
    const result = [];
    for (const aid of batch.agents.map((id) => id.toString())) {
      const agent = agents.find((x) => x._id.toString() === aid) || null;
      result.push({
        agent: agent ? { id: agent._id, name: agent.name, email: agent.email, mobile: agent.mobile } : { id: aid },
        tasks: tasksByAgent[aid] || []
      });
    }

    return res.json({
      success: true,
      batch: { id: batch._id, filename: batch.filename, totalItems: batch.totalItems, createdAt: batch.createdAt },
      distributions: result
    });
  } catch (err) {
    console.error('Get distributions error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
