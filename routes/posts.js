const express = require('express');
const router = express.Router();
const { createPost, getPosts } = require('../controller/postController');
const { upload, handleMulterError } = require('../middleware/multer');

router.post('/', upload.single('image'), handleMulterError, createPost);
router.get('/', getPosts);

module.exports = router;