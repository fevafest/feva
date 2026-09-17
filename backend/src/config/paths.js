const path = require('path');

/**
 * Where uploaded files (event posters, blog covers, avatars, organizer
 * logos) are read from and written to. Defaults to a folder inside the
 * project, which works locally and on Render's free tier — but that
 * storage is wiped on every deploy/restart there.
 *
 * On a paid Render plan (or any host that supports attached volumes), set
 * UPLOADS_DIR to the mount path of a persistent disk (e.g. /var/data/uploads)
 * so uploaded files survive deploys. See render.yaml for the matching disk
 * config and the README for the exact steps.
 */
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

module.exports = { uploadsRoot };
