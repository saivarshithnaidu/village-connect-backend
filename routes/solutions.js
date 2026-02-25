const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Solution = require('../models/Solution');
const Problem = require('../models/Problem');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET /api/solutions
// @desc    Get all solutions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { problem, status, sort = '-createdAt' } = req.query;
    const filter = {};
    
    if (problem) filter.problem = problem;
    if (status) filter.status = status;

    const solutions = await Solution.find(filter)
      .populate('problem', 'title description status')
      .populate('proposedBy', 'name email village')
      .sort(sort)
      .limit(parseInt(req.query.limit) || 50);

    res.json(solutions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/solutions/:id
// @desc    Get single solution
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id)
      .populate('problem', 'title description status category location')
      .populate('proposedBy', 'name email village')
      .populate('comments.user', 'name email');

    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/solutions
// @desc    Create a new solution
// @access  Private
router.post('/', [
  auth,
  body('problem').notEmpty().withMessage('Problem ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const problem = await Problem.findById(req.body.problem);
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const solution = new Solution({
      ...req.body,
      proposedBy: req.user._id
    });

    await solution.save();
    
    // Add solution to problem
    problem.solutions.push(solution._id);
    await problem.save();

    await solution.populate('problem', 'title description');
    await solution.populate('proposedBy', 'name email village');

    res.status(201).json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/solutions/:id
// @desc    Update a solution
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    // Only the proposer or admin can update
    if (solution.proposedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(solution, req.body);
    await solution.save();
    await solution.populate('problem', 'title description');
    await solution.populate('proposedBy', 'name email village');

    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/solutions/:id/upvote
// @desc    Upvote a solution
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    const upvoteIndex = solution.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      solution.upvotes.splice(upvoteIndex, 1);
    } else {
      solution.upvotes.push(req.user._id);
    }

    await solution.save();
    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/solutions/:id/comments
// @desc    Add comment to solution
// @access  Private
router.post('/:id/comments', [
  auth,
  body('text').trim().notEmpty().withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    solution.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    await solution.save();
    await solution.populate('comments.user', 'name email');

    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/solutions/:id/status
// @desc    Update solution status (Admin only)
// @access  Private/Admin
router.put('/:id/status', auth, adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    solution.status = status;
    if (status === 'implemented') solution.implementedAt = new Date();

    await solution.save();
    await solution.populate('problem', 'title description');
    await solution.populate('proposedBy', 'name email village');

    res.json(solution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/solutions/:id
// @desc    Delete a solution
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const solution = await Solution.findById(req.params.id);
    
    if (!solution) {
      return res.status(404).json({ message: 'Solution not found' });
    }

    // Only the proposer or admin can delete
    if (solution.proposedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove solution from problem
    await Problem.findByIdAndUpdate(solution.problem, {
      $pull: { solutions: solution._id }
    });

    await Solution.findByIdAndDelete(req.params.id);

    res.json({ message: 'Solution deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

