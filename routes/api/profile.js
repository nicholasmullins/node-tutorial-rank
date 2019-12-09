const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Video = require('../../models/Video')
const { check, validationResult } = require('express-validator');

// GET Current User's Profile
// api/profile/me

router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate(
      'user', // when finding the profile we want to pull (populate) from the user model
      ['name', 'avatar']
    );

    if (!profile) {
      return res.status(400).json({ msg: 'No Profile Found for This User' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST - Create or Update Profile
// api/profile

router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is Required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { status, bio, knowledgelevel, purpose, wanttolearn } = req.body; // we are pulling all of these things from the req.body to populate if the user filled these out

    // Build profile object

    const profileFields = {};
    profileFields.user = req.user.id;
    if (status) profileFields.status = status; // checking with all of these to see if something is coming in so that we can set it.
    if (bio) profileFields.bio = bio;
    if (knowledgelevel) profileFields.knowledgelevel = knowledgelevel;
    if (purpose) profileFields.purpose = purpose;
    if (wanttolearn) {
      // turning an object into an array
      profileFields.wanttolearn = wanttolearn
        .split(',')
        .map(wanttolearn => wanttolearn.trim()); //split to add commas, and map to go through and trim any unequal spaces.
    }

    try {
      let profile = await Profile.findOne({ user: req.user.id }); // looking for a profile for the user
      if (profile) {
        // if found we are updating all of the info
        // Update
        await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        );
        return res.json(profile); // ...and returning the profile
      }

      profile = new Profile(profileFields); // if the profile is not found we are going to create it

      await profile.save(); // we save the variable that we made that stores the newly created profile
      res.json(profile); // and send the profile back
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }

    console.log(profileFields.wanttolearn);

    res.send('Hello');
  }
);

// GET All Profiles
// api/profile

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET Profile By ID
// api/profile/user/user_id

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      // Find one profile with a the params of the id in the browser
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']); // populate the user info (name and avatar)

    if (!profile) return res.status(400).json({ msg: 'Profile not found' }); // if no profile found
    res.json(profile); // if profile found
  } catch (err) {
    console.log(err.message);

    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' }); // if the kind equals the object id then do not pull up the profile
    }
  }
});

// DELETE Profile, User, Videos and Reviews
// api/profile/user/user_id

router.delete('/', auth, async (req, res) => {
  try {

    // Remove user videos
    await Video.deleteMany({ user: req.user.id });

    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id }); // Remove Profile

    // Remove user
    await User.findOneAndRemove({ _id: req.user.id }); // Remove User

    res.json({ msg: 'User Deleted'}); 
  } catch (err) {
    
    res.status(500).send('Server Error')
    }
});

module.exports = router;
