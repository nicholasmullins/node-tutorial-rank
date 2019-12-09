const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');

// GET ROUTE
// api/auth

router.get('/', auth, async (req, res) => {
  // since we imported the auth function from middleware, we can now bring in req.user from any route that calls AUTH
  try {
    const user = await User.findById(req.user.id).select('-password'); // for security this stops the user's password from being returned.
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server Error');
  }
});

// POST ROUTE
// api/auth
// Authenticate User and Get Token

router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // 400 is a Bad Request // array() is a method that sends an array describing all errors from above
    }

    // See if the user exists

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password); // bcrypt has a great compare function which will compare the entered password to the one on file(encrypted)

      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // Using JSON web token
      // Get the payload
      const payload = {
        user: {
          id: user.id // since we are using MongoDB, we don't need to write ._id as Mongo has an abstraction that allows just .id
        }
      };

      // Pass in the payload and the secret
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token }); // if no error, we send the token back to the client
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

module.exports = router;
