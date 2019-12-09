const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Video = require('../../models/Video');

// POST - Create Video
// api/videos

/// NEED TO MAKE THIS PRIVATE!

router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('desc', 'Description is required')
        .not()
        .isEmpty(),
      check('teacher', 'Teacher is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const newVideo = new Video({
        title: req.body.title,
        desc: req.body.desc,
        teacher: req.body.teacher,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const video = await newVideo.save();

      res.json(video);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// GET - ALL Videos
// api/videos

router.get('/', async (req, res) => {
  try {
    const videos = await Video.find().sort({ date: -1 }); // by putting date -1 ...it will show the most recently posted videos first!
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET - Video by ID
// api/videos/:id

router.get('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id); // finding the video by the ID in the params

    if (!video) {
      return res.status(404).json({ msg: 'Video Not Found' });
    }

    res.json(video);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Video Not Found' });
    }

    res.status(500).send('Server Error');
  }
});

// DELETE - Video
// api/videos/:id

router.delete('/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ msg: 'Video Not Found' });
    }

    // check to see if this is the user who posted before they can delete
    if (video.user.toString() !== req.user.id) {
      // we are doing the toString method because the user in video is an object id so it needs to be turned into a string to match user.id

      return res.status(401).json({ msg: 'User not authorized' });
    }

    await video.remove();

    res.json({ msg: 'Video Removed' });
  } catch (err) {
    console.error(err.message);

    if (err.kind == 'ObjectId') {
      return res.status(404).json({ msg: 'Video Not Found' });
    }
    res.status(500).send('Server Error');
  }
});

// PUT - Like a Post
// api/videos/like/:id

router.put('/like/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    // Check to see if the post has already been liked
    if (
      video.likes.filter(like => like.user.toString() === req.user.id).length >
      0
    ) {
      // with this we are making sure it hasn't been liked by the user already
      return res.status(400).json({ msg: 'Video already liked' });
    }

    video.likes.unshift({ user: req.user.id }); // this is adding the likes to that user ID

    await video.save();

    res.json(video.likes); // instead of saving this in a variable, we are adding it as video.likes because of something in Redux
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT - UNLike a Post
// api/videos/unlike/:id

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    // Check to see if the post has already been liked
    if (
      video.likes.filter(like => like.user.toString() === req.user.id)
        .length === 0
    ) {
      // with this we are making sure it has been liked by the user already. If length is 0 then the user hasn't liked it so they can't unlike it
      return res
        .status(400)
        .json({ msg: 'Can not Unlike, Video has not yet been liked' });
    }

    // Get remove index

    const removeIndex = video.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id); // we are mapping through the likes to get the index of the user.id in the like

    video.likes.splice(removeIndex, 1); // then we will splice that index from the array

    await video.save();

    res.json(video.likes); // instead of saving this in a variable, we are adding it as video.likes to see an empty array because of something in Redux
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST - Review a Video
// api/videos/review/:id

router.post(
  '/review/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');

      const video = await Video.findById(req.params.id);

      const newReview = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };

      video.reviews.unshift(newReview);

      await video.save();

      res.json(video);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// DELETE - Delete a Review
// api/videos/review/:id/:comment_id

router.delete('/review/:id/:review_id', auth, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    console.log(video);

    // Pull out a review // we are searching the video reviews and pulling out the id that matcheds the id in the params

    const review = video.reviews.find(
      review => review.id === req.params.review_id
    );

    // Make sure the review exists

    if (!review) {
      return res.status(404).json({ msg: 'Review does not exist' });
    }

    // Make sure the user is the one deleting their review

    if (review.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'User not authorized to delete this review' });
    }

    // Find the index of the review and then splice it out

    const removeIndex = video.reviews
      .map(review => review.user.toString())
      .indexOf(req.user.id); // we are mapping through the likes to get the index of the user.id in the like

    video.reviews.splice(removeIndex, 1); // then we will splice that index from the array

    await video.save();

    res.json(video.reviews); // returns the array of reviews with your review deleted
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
