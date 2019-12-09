const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const config = require('config')
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User')

// POST ROUTE
// api/users
// REGISTER User

router.post(
  '/',
  [
    check('name', 'Name is required')
      .not()
      .isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password', // param
      'Please enter a password with 6 or more characters' // message
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json( {errors: errors.array()} ) // 400 is a Bad Request // array() is a method that sends an array describing all errors from above
    }


    // See if the user exists 

    const {name, email, password} = req.body;

    try {
        let user = await User.findOne({ email })
        if(user) {
            return res.status(400).json( {errors: [{msg: 'User already exists'}]} ) 
        }


    // Get user avatar using Gravatar 
    
    
    const avatar = gravatar.url(email, {
        s: '200', // size of avatar
        r: 'pg', // rating of avatar (no dirty pictures)
        d: 'mm'  // gives a default image if no avatar is given by user

    })

    // Create User

    user = new User({
        name,
        email,
        avatar,
        password

    })


    // Encrypt password 

    const salt = await bcrypt.genSalt(10) // this stores the hash function in  variable

    user.password = await bcrypt.hash(password, salt);

    // Save the User

    await user.save();
    
    // Using JSON web token
    // Get the payload
    const payload = {
        user: {
            id: user.id // since we are using MongoDB, we don't need to write ._id as Mongo has an abstraction that allows just .id
        }
    }

    // Pass in the payload and the secret
    jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000}, (err, token) => {
        if(err) throw err;
        res.json( {token} ); // if no error, we send the token back to the client
    })
        
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Server Error')
    }
  }
);




module.exports = router;



