const express = require('express');
const router = express.Router();
// We'll create this controller in the next step
const gameController = require('../controllers/gameController');

// Create a new game
router.post('/create', gameController.createGame);

// Join an existing game
router.post('/join', gameController.joinGame);

// Start a game
router.post('/start', gameController.startGame);

// Submit a punchline
router.post('/punchline', gameController.submitPunchline);

// Submit a vote
router.post('/vote', gameController.submitVote);

// Get game state
router.get('/:gameId', gameController.getGameState);

// End a game
router.post('/end', gameController.endGame);

module.exports = router;