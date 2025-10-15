const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getTemplates,
  createTemplate,
} = require('../controllers/template');

// @route   GET api/templates
// @desc    Get all of user's templates
// @access  Private
router.get('/', auth, getTemplates);

// @route   POST api/templates
// @desc    Create a new template
// @access  Private
router.post('/', auth, createTemplate);

module.exports = router;
