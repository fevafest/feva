const express = require('express');
const { listPosts, getPostBySlug, createPost, updatePost, deletePost } = require('../controllers/blogController');
const { protect, authorize } = require('../middleware/auth');
const { uploadBlogCover } = require('../middleware/upload');

const router = express.Router();

router.get('/', listPosts);
router.get('/:slug', getPostBySlug);

router.post('/', protect, authorize('admin'), uploadBlogCover.single('cover'), createPost);
router.put('/:id', protect, authorize('admin'), uploadBlogCover.single('cover'), updatePost);
router.delete('/:id', protect, authorize('admin'), deletePost);

module.exports = router;
