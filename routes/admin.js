const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const Solution = require('../models/Solution');
const ForumPost = require('../models/ForumPost');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

// All routes require admin authentication
router.use(auth, adminAuth);

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
// @access  Private/Admin
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalProblems,
      totalSolutions,
      totalForumPosts,
      solvedProblems,
      unsolvedProblems,
      problemsByStatus,
      problemsByCategory,
      recentProblems,
      recentSolutions
    ] = await Promise.all([
      User.countDocuments(),
      Problem.countDocuments(),
      Solution.countDocuments(),
      ForumPost.countDocuments(),
      Problem.countDocuments({ status: 'resolved' }),
      Problem.countDocuments({ status: { $ne: 'resolved' } }),
      Problem.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Problem.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Problem.find().sort('-createdAt').limit(5).populate('reportedBy', 'name email'),
      Solution.find().sort('-createdAt').limit(5).populate('proposedBy', 'name email')
    ]);

    res.json({
      totalUsers,
      totalProblems,
      solvedProblems,
      unsolvedProblems,
      totalSolutions,
      totalForumPosts,
      problemsByStatus,
      problemsByCategory,
      recentProblems,
      recentSolutions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users
// @access  Private/Admin
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private/Admin
router.put('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/problems
// @desc    Get all problems with filters (including unverified)
// @access  Private/Admin
router.get('/problems', async (req, res) => {
  try {
    const { status, category, priority, isVerified } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';

    const problems = await Problem.find(filter)
      .populate('reportedBy', 'name email village')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');

    res.json(problems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/solutions
// @desc    Get all solutions with filters
// @access  Private/Admin
router.get('/solutions', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    
    if (status) filter.status = status;

    const solutions = await Solution.find(filter)
      .populate('problem', 'title description')
      .populate('proposedBy', 'name email village')
      .sort('-createdAt');

    res.json(solutions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/admin/problems/:id/assign
// @desc    Assign problem to villager
// @access  Private/Admin
router.put('/problems/:id/assign', async (req, res) => {
  try {
    const { assignedTo } = req.body;
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Verify assigned user is a villager
    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser || assignedUser.role !== 'villager') {
      return res.status(400).json({ message: 'Can only assign to villagers' });
    }

    problem.assignedTo = assignedTo;
    problem.status = 'in-progress';
    await problem.save();
    await problem.populate('reportedBy', 'name email village');
    await problem.populate('assignedTo', 'name email village');

    res.json(problem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

