const express = require('express');
const router = express.Router();
const validateForm = require('../controllers/validateForm');
const { rateLimiter } = require('../controllers/rateLimiter');

const { handleLogin, AttemptLogin, AttemptRegister } = require('../controllers/authController');



router 
.route('/login')
.get(handleLogin)
.post(validateForm, rateLimiter(10, 60), AttemptLogin)


router.post('/signup', validateForm, rateLimiter(5, 60), AttemptRegister)


module.exports = router;
