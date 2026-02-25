const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const ForumPost = require('../models/ForumPost');
const { auth, adminAuth } = require('../middleware/auth');

// @route   GET /api/forum
// @desc    Get all forum posts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, sort = '-createdAt' } = req.query;
    const filter = {};
    
    if (category) filter.category = category;

    const posts = await ForumPost.find(filter)
      .populate('author', 'name email village')
      .populate('comments.user', 'name email')
      .sort(sort)
      .limit(parseInt(req.query.limit) || 50);

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/forum/:id
// @desc    Get single forum post
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id)
      .populate('author', 'name email village')
      .populate('comments.user', 'name email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum
// @desc    Create a new forum post
// @access  Private
router.post('/', [
  auth,
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('content').trim().notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const post = new ForumPost({
      ...req.body,
      author: req.user._id
    });

    await post.save();
    await post.populate('author', 'name email village');

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forum/:id
// @desc    Update a forum post
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only the author or admin can update
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Object.assign(post, req.body);
    await post.save();
    await post.populate('author', 'name email village');

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/:id/upvote
// @desc    Upvote a forum post
// @access  Private
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const upvoteIndex = post.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      post.upvotes.splice(upvoteIndex, 1);
    } else {
      post.upvotes.push(req.user._id);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/:id/comments
// @desc    Add comment to forum post
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

    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      user: req.user._id,
      text: req.body.text
    });

    await post.save();
    await post.populate('comments.user', 'name email');

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/forum/:id/comments/:commentId/upvote
// @desc    Upvote a comment
// @access  Private
router.post('/:id/comments/:commentId/upvote', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const upvoteIndex = comment.upvotes.indexOf(req.user._id);
    if (upvoteIndex > -1) {
      comment.upvotes.splice(upvoteIndex, 1);
    } else {
      comment.upvotes.push(req.user._id);
    }

    await post.save();
    await post.populate('comments.user', 'name email');

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/forum/:id/pin
// @desc    Pin/unpin a forum post (Admin only)
// @access  Private/Admin
router.put('/:id/pin', auth, adminAuth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();
    await post.populate('author', 'name email village');

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/forum/:id
// @desc    Delete a forum post
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only the author or admin can delete
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await ForumPost.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

