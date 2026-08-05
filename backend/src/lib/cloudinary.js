const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { Readable } = require('stream');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Memory storage for multer
const storage = multer.memoryStorage();

// Upload middleware
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype.match(/^image\//)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Upload to Cloudinary helper - returns the secure URL
const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `lus4g-church/${folder}`,
        transformation: [{ width: 1200, height: 1200, crop: 'limit' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url); // Return just the URL string
      }
    );
    
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// Extract public_id from a full Cloudinary URL or return as-is
const extractPublicId = (urlOrId) => {
  if (!urlOrId) return null;
  if (!urlOrId.startsWith('http')) return urlOrId; // already a public_id
  try {
    // e.g. https://res.cloudinary.com/cloud/image/upload/v123/lus4g-church/profiles/abc.jpg
    const parts = urlOrId.split('/');
    const uploadIdx = parts.indexOf('upload');
    if (uploadIdx === -1) return null;
    // skip version segment (v12345) if present
    let start = uploadIdx + 1;
    if (parts[start] && parts[start].match(/^v\d+$/)) start++;
    const withExt = parts.slice(start).join('/');
    return withExt.replace(/\.[^/.]+$/, ''); // strip extension
  } catch { return null; }
};

// Delete image from Cloudinary
const deleteImage = async (urlOrPublicId) => {
  try {
    const publicId = extractPublicId(urlOrPublicId);
    if (!publicId) return false;
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteImage,
};
