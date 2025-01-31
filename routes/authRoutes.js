const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameControllers');

router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

router.get('/daily-hexcode', gameController.getTodaysHexCode);
router.post('/save-guess', gameController.saveGuess);
router.get('/get-guesses', gameController.getGuesses);
router.get('/get-user-stats', gameController.getUserStats);
router.post('/update-user-stats', gameController.updateUserStats);
router.get('/top5-players', gameController.getTop5)

module.exports = router;