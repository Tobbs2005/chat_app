const express = require('express');
const router = express.Router();
const validateForm = require('../controllers/validateForm');

const { handleLogin, AttemptLogin, AttemptRegister } = require('../controllers/authController');



router 
.route('/login')
.get(handleLogin)
.post(validateForm, AttemptLogin)


router.post('/signup', validateForm, AttemptRegister)


module.exports = router;
