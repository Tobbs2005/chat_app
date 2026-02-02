const express = require('express');
const router = express.Router();
const yup = require('yup');
const validateForm = require('../controllers/validateForm');

router.post('/login', (req, res) => {
  validateForm(req, res);
});


router.post('/signup', (req, res) => {
  validateForm(req, res);
});


module.exports = router;
