const express = require('express');
const router = express.Router();
const { createTag, getTags } = require('../controller/tagController');

router.post('/', createTag);
router.get('/', getTags);

module.exports = router;