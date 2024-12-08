const express = require('express');
const router = express.Router();
const path = require('path');
const { game } = require('../controllers/gameControllers');

// route for the game functionality
router.get('/game-functionality', (req, res) => {
    res.send(game());
});

module.exports = router;