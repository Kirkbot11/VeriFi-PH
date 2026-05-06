const express = require('express');
const router = express.Router();

const asyncHandler = require('../middleware/asyncHandler');
const { analyzeUrl } = require('../controllers/analyzeController');

// ✅ ONLY THIS
router.post('/', analyzeUrl);

module.exports = router;