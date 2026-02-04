const express = require('express');
const router = express.Router();
const yup = require('yup');
const validateForm = require('../controllers/validateForm');
const pool = require('../db');
const bcrypt = require('bcrypt');



router
.route('/login')
.get(async (req, res) => {
  if (req.session.user && req.session.user.username) {
    console.log("already logged in");
    res.json({loggedIn: true, username: req.session.user.username});
  } else {
    res.json({loggedIn: false});
  }
})
.post(async (req, res) => {
  validateForm(req, res);

  const potentialLogin = await pool.query(
    'SELECT id, username, passhash FROM users WHERE username = $1',
    [req.body.username]
  );

  if (potentialLogin.rowCount > 0) {
    // user found
    const isSamePass = await bcrypt.compare(
      req.body.password, 
      potentialLogin.rows[0].passhash
    );
    if (isSamePass) {
      // login user
      req.session.user = {
        username: req.body.username,
        id: potentialLogin.rows[0].id,
      }
  
      res.json({ loggedIn: true,  username: req.body.username });

    } else {
      // not good login
      res.json({loggedIn: false, status: "Wrong username or password"});
      console.log("Wrong username or password");
    }
  } else {
    // user not found
    res.json({loggedIn: false, status: "Wrong username or password"});
    console.log("Wrong username or password");
  }


});


router.post('/signup', async (req, res) => {
  validateForm(req, res);

  const existingUser = await pool.query(
    'SELECT username FROM users WHERE username = $1'
    , [req.body.username]
  );

  if (existingUser.rows.length === 0) {
    //register user
    const hashedPass = await bcrypt.hash(req.body.password, 10);
    const newUserQuery = await pool.query(
      'INSERT INTO users (username, passhash) VALUES ($1, $2) RETURNING id, username',
      [req.body.username, hashedPass]
    );

    req.session.user = {
      username: req.body.username,
      id: newUserQuery.rows[0].id,
    }

    res.json({ loggedIn: true,  username: req.body.username });

  }
  else {
    //user already exists
    res.json({loggedIn: false, status: "User already exists"});
  }
});


module.exports = router;
