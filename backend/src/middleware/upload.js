const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { ApiError } = require('../utils/apiResponse');
const { uploadsRoot } = require('../config/paths');

const hasCloudinary =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  for (const sub of ['events', 'blog', 'avatars', 'organizers']) {
    const dir = path.join(uploadsRoot, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function storageFor(subfolder) {
  if (hasCloudinary) {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        folder: `feva/${subfolder}`,
        allowed_formats: ['jpeg', 'png', 'jpg', 'webp', 'gif'],
      },
    });
  }

  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(uploadsRoot, subfolder)),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, unique);
    },
  });
}

function imageFileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new ApiError(400, 'Only image files (jpeg, png, webp, gif) are allowed.'));
  }
  cb(null, true);
}

function makeUploader(subfolder) {
  return multer({
    storage: storageFor(subfolder),
    fileFilter: imageFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 },
  });
}

/**
 * Returns the public URL for an uploaded file.
 * Automatically supports both Cloudinary URLs (full HTTPS URL) and local disk fallback (/uploads/...).
 */
function getUploadedUrl(file, subfolder) {
  if (!file) return undefined;
  if (file.path && /^https?:\/\//i.test(file.path)) {
    return file.path;
  }
  return `/uploads/${subfolder}/${file.filename}`;
}

module.exports = {
  getUploadedUrl,
  uploadEventPoster: makeUploader('events'),
  uploadBlogCover: makeUploader('blog'),
  uploadAvatar: makeUploader('avatars'),
  uploadOrganizerLogo: makeUploader('organizers'),
};
