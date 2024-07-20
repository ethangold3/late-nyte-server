const express = require('express');
const router = express.Router();
// We'll create this controller in the next step
const gameController = require('../controllers/gameController');
const articleUpdater = require('../controllers/updateNewsArticles')

// Create a new game
router.post('/create', async (req, res) => {

    try {
        const result = await gameController.createGame();
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
    });

// Join an existing game
router.post('/join', async (req, res) => {
    try {
      const result = await gameController.joinGame(req.body.gameId, req.body.username);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
// Start a game
router.post('/start', async (req, res) => {
    try {
        const result = await gameController.startGame(req.body.gameId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
    });

// Start a game
router.post('/next', async (req, res) => {
    try {
        const result = await gameController.nextRound(req.body.gameId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
    });

// Submit a punchline
router.post('/punchline', async (req, res) => {

    try {
        const result = await gameController.submitPunchline(req.body.gameId, req.body.username, req.body.newsArticleId, req.body.punchlinetext)
        //text,author, gameID
        //get newsprompt from gameID and round
        res.status(200).json(result);
    }  catch (error) {
        res.status(500).json({error : error.message});
    }
    });
// Submit a vote
router.post('/vote', async (req, res) => {
    try {
        const result = await gameController.submitVote(req.body.gameId, req.body.username, req.body.punchlineId);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({error : error.message});
    }
    });



router.post('/updateArticles', async (req, res) => {

    try {
        await articleUpdater.updateNewsArticles();
        res.status(201).json("Updated Articles");
    } catch (error) {
        res.status(500).json({error : error.message});
    }
    });


// Get game state
router.get('/:gameId', gameController.getGameState);

// End a game
router.post('/end', gameController.endGame);

module.exports = router;