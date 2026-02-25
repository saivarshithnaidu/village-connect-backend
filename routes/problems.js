const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// Optional auth middleware for GET routes
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// @route   GET /api/problems
// @desc    Get all problems
// @access  Public
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { status, category, priority, sort = '-createdAt' } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    // If user is a volunteer, only show verified problems
    // If user is admin, show all problems
    // If user is villager or not logged in, show all problems (they can see their own unverified ones)
    if (req.user && req.user.role === 'volunteer') {
      filter.isVerified = true;
    }

    const problems = await Problem.find(filter)
      .populate('reportedBy', 'name email village')
      .populate('assignedTo', 'name email')
      .sort(sort)
      .limit(parseInt(req.query.limit) || 50);

    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/problems/:id
// @desc    Get single problem
// @access  Public
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('reportedBy', 'name email village')
      .populate('assignedTo', 'name email')
      .populate({
        path: 'solutions',
        populate: { path: 'proposedBy', select: 'name email village' }
      });

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // If user is a volunteer, only allow access to verified problems
    if (req.user && req.user.role === 'volunteer' && !problem.isVerified) {
      return res.status(403).json({ message: 'This problem is not yet verified' });
    }

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/problems
// @desc    Create a new problem
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['infrastructure', 'health', 'education', 'agriculture', 'water', 'electricity', 'transport', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const problem = new Problem({
      ...req.body,
      reportedBy: req.user._id
    });

    await problem.save();
    await problem.populate('reportedBy', 'name email village');

    res.status(201).json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id
// @desc    Update a problem
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Only the reporter or admin can update
    if (problem.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(problem, req.body);
    await problem.save();
    await problem.populate('reportedBy', 'name email village');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/problems/:id/upvote
// @desc    Upvote a problem
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const upvoteIndex = problem.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      problem.upvotes.splice(upvoteIndex, 1);
    } else {
      problem.upvotes.push(req.user._id);
    }

    await problem.save();
    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id/status
// @desc    Update problem status (Admin only)
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    problem.status = status;
    if (assignedTo) problem.assignedTo = assignedTo;
    if (status === 'resolved') problem.resolvedAt = new Date();

    await problem.save();
    await problem.populate('reportedBy', 'name email village');
    await problem.populate('assignedTo', 'name email');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id/verify
// @desc    Verify a problem (Admin only)
// @access  Private/Admin
router.put('/:id/verify', auth, adminAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    problem.isVerified = true;
    await problem.save();
    await problem.populate('reportedBy', 'name email village');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/problems/assigned/me
// @desc    Get problems assigned to current villager
// @access  Private/Villager
router.get('/assigned/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'villager') {
      return res.status(403).json({ message: 'Only villagers can access assigned problems' });
    }

    const problems = await Problem.find({ assignedTo: req.user._id })
      .populate('reportedBy', 'name email village')
      .sort('-createdAt');

    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id/complete
// @desc    Mark problem as completed by villager
// @access  Private/Villager
router.put('/:id/complete', auth, async (req, res) => {
  try {
    if (req.user.role !== 'villager') {
      return res.status(403).json({ message: 'Only villagers can complete problems' });
    }

    const { completionMessage } = req.body;
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Check if problem is assigned to this villager
    if (problem.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'This problem is not assigned to you' });
    }

    problem.isCompletedByVillager = true;
    problem.completionMessage = completionMessage || '';
    problem.status = 'resolved';
    problem.resolvedAt = new Date();
    await problem.save();
    await problem.populate('reportedBy', 'name email village');
    await problem.populate('assignedTo', 'name email village');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/problems/:id/verify-completion
// @desc    Admin verifies villager's completion and makes it visible to village
// @access  Private/Admin
router.put('/:id/verify-completion', auth, adminAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!problem.isCompletedByVillager) {
      return res.status(400).json({ message: 'Problem has not been completed by villager yet' });
    }

    problem.isVerified = true;
    problem.status = 'resolved';
    await problem.save();
    await problem.populate('reportedBy', 'name email village');
    await problem.populate('assignedTo', 'name email village');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/problems/:id
// @desc    Delete a problem
// @access  Private/Admin
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Delete associated solutions
    await Solution.deleteMany({ problem: problem._id });
    await Problem.findByIdAndDelete(req.params.id);

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

