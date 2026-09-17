const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('../utils/apiResponse');
const { uploadsRoot } = require('../config/paths');

for (const sub of ['events', 'blog', 'avatars', 'organizers']) {
  const dir = path.join(uploadsRoot, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function storageFor(subfolder) {
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
    limits: { fileSize: 5 * 1024 * 1024 },
  });
}

module.exports = {
  uploadEventPoster: makeUploader('events'),
  uploadBlogCover: makeUploader('blog'),
  uploadAvatar: makeUploader('avatars'),
  uploadOrganizerLogo: makeUploader('organizers'),
};
