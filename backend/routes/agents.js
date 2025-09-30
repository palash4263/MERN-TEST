const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const Agent = require('../models/Agent');

/**
 * @route POST /api/agents
 * @desc  Create a new agent 
 * @access Public  
 */
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().withMessage('Valid email required'),
    // mobile: expect + then 6-15 digits total (country code + number)
    body('mobile')
      .matches(/^\+\d{6,15}$/)
      .withMessage('Mobile must include country code, e.g. +919876543210'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, mobile, password } = req.body;

    try {
      // Prevent duplicate email
      let existing = await Agent.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });


      existing = await Agent.findOne({ mobile });
      if (existing) return res.status(400).json({ success: false, message: 'Mobile already registered' });

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(password, salt);

      const agent = new Agent({ name, email, mobile, password: hashed });
      await agent.save();

      // Do NOT return password
      return res.status(201).json({
        success: true,
        message: 'Agent created',
        agent: { id: agent._id, name: agent.name, email: agent.email, mobile: agent.mobile }
      });
    } catch (err) {
      console.error('Create agent error:', err);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

router.get('/', /* authMiddleware, */ async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 20));
    const search = req.query.search ? String(req.query.search).trim() : null;

    const filter = {};
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ name: re }, { email: re }, { mobile: re }];
    }

    const total = await Agent.countDocuments(filter);
    const pages = Math.ceil(total / limit);
    const agents = await Agent.find(filter)
      .select('-password') // exclude password
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: agents,
      meta: { total, page, limit, pages }
    });
  } catch (err) {
    console.error('List agents error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * GET /api/agents/:id
 * Get a single agent by id 
 */
router.get('/:id', /* authMiddleware, */ async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id).select('-password').lean();
    if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
    res.json({ success: true, data: agent });
  } catch (err) {
    console.error('Get agent error:', err);
    // handle invalid ObjectId
    if (err.kind === 'ObjectId') return res.status(400).json({ success: false, message: 'Invalid id' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


module.exports = router;
