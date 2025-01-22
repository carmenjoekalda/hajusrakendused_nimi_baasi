const express = require('express');
const router = express.Router();
const { signUp, signIn } = require('../controllers/authController');
const { getTodaysHexCode } = require('../controllers/gameControllers');

router.post('/', )
router.post('/signup', signUp);
router.post('/signIn', signIn);

router.get('/daily-hexcode', getTodaysHexCode)

module.exports = router;