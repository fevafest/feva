const BlogPost = require('../models/BlogPost');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError, success } = require('../utils/apiResponse');
const { getUploadedUrl } = require('../middleware/upload');

const listPosts = asyncHandler(async (req, res) => {
  const { featured, page = 1, limit = 9 } = req.query;
  const query = { isPublished: true };
  if (featured === 'true') query.isFeatured = true;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 9, 1), 30);

  const [posts, total] = await Promise.all([
    BlogPost.find(query)
      .populate('author', 'fullName avatar')
      .sort({ publishedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    BlogPost.countDocuments(query),
  ]);

  return success(res, 200, 'Blog posts fetched.', posts, {
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum),
  });
});

const getPostBySlug = asyncHandler(async (req, res) => {
  const post = await BlogPost.findOne({ slug: req.params.slug }).populate(
    'author',
    'fullName avatar'
  );
  if (!post || !post.isPublished) throw new ApiError(404, 'Blog post not found.');
  return success(res, 200, 'Blog post fetched.', post);
});

const createPost = asyncHandler(async (req, res) => {
  const { title, excerpt, content, tags, isFeatured, isPublished } = req.body;
  if (!title || !content) throw new ApiError(400, 'Title and content are required.');

  const post = await BlogPost.create({
    title,
    excerpt,
    content,
    tags: typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags,
    isFeatured: isFeatured === 'true' || isFeatured === true,
    isPublished: isPublished !== 'false' && isPublished !== false,
    author: req.user._id,
    coverImage: getUploadedUrl(req.file, 'blog'),
  });

  return success(res, 201, 'Blog post created.', post);
});

const updatePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Blog post not found.');

  const { title, excerpt, content, tags, isFeatured, isPublished } = req.body;
  if (title) post.title = title;
  if (excerpt !== undefined) post.excerpt = excerpt;
  if (content) post.content = content;
  if (tags) post.tags = typeof tags === 'string' ? tags.split(',').map((t) => t.trim()) : tags;
  if (isFeatured !== undefined) post.isFeatured = isFeatured === 'true' || isFeatured === true;
  if (isPublished !== undefined) post.isPublished = isPublished !== 'false' && isPublished !== false;
  if (req.file) post.coverImage = getUploadedUrl(req.file, 'blog');

  await post.save();
  return success(res, 200, 'Blog post updated.', post);
});

const deletePost = asyncHandler(async (req, res) => {
  const post = await BlogPost.findById(req.params.id);
  if (!post) throw new ApiError(404, 'Blog post not found.');
  await post.deleteOne();
  return success(res, 200, 'Blog post deleted.');
});

module.exports = { listPosts, getPostBySlug, createPost, updatePost, deletePost };
