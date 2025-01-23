const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameControllers');

router.post('/', )
router.post('/signup', authController.signUp);
router.post('/signIn', authController.signIn);

router.get('/daily-hexcode', gameController.getTodaysHexCode)
router.post('/save-guess', gameController.saveGuess);
router.get('/get-guesses', gameController.getGuesses);

module.exports = router;