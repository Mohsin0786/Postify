require('dotenv').config(); // Load environment variables
const { S3Client } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const createError = require('http-errors');

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Create S3 client with the correct region and endpoint
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    endpoint: `https://s3.${process.env.AWS_REGION}.amazonaws.com`,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    },
    forcePathStyle: true // This might be needed depending on your region
});

// Configure multer with S3
const upload = multer({
    fileFilter: (req, file, cb) => {
        // Check file type
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(new Error('Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP'), false);
        }
        cb(null, true);
    },
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME,
        acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname,
                contentType: file.mimetype
            });
        },
        key: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            // Clean the original filename and add timestamp
            const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase();
            cb(null, `uploads/${uniqueSuffix}-${cleanFileName}`);
        }
    })
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return next(createError(400, `File too large. Max size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
        }
        return next(createError(400, err.message));
    }
    if (err) {
        return next(createError(400, err.message));
    }
    next();
};

module.exports = { upload, handleMulterError };