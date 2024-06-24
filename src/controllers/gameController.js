const GameSession = require('../models/GameSession');
const NewsArticle = require('../models/NewsArticle');
const Punchline = require('../models/Punchline');

// Helper function to generate a unique game ID
const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

exports.createGame = async (req, res) => {
    try {
        const newGame = new GameSession({
            gameId: generateUniqueId(),
            status: 'waiting',
            totalRounds: 5 // You can make this configurable later
        });
        await newGame.save();
        res.status(201).json({ gameId: newGame.gameId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating game', error: error.message });
    }
};

exports.joinGame = async (req, res) => {
    const { gameId, username } = req.body;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        if (game.status !== 'waiting') {
            return res.status(400).json({ message: 'Game already in progress' });
        }
        game.players.push({ username, score: 0 });
        await game.save();
        res.status(200).json({ message: 'Joined game successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error joining game', error: error.message });
    }
};

exports.startGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        if (game.players.length < 2) {
            return res.status(400).json({ message: 'Not enough players to start' });
        }
        game.status = 'in-progress';
        game.currentRound = 1;
        // Here you would also select and add the first NewsArticle
        await game.save();
        res.status(200).json({ message: 'Game started successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error starting game', error: error.message });
    }
};


exports.submitVote = async (req, res) => {
    const { gameId, username, votedForPunchlineId } = req.body;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game || game.status !== 'in-progress') {
            return res.status(400).json({ message: 'Invalid game' });
        }
        // Here you would add the vote to the current round and update scores
        res.status(200).json({ message: 'Vote submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting vote', error: error.message });
    }
};

exports.getGameState = async (req, res) => {
    const { gameId } = req.params;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        res.status(200).json(game);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching game state', error: error.message });
    }
};

exports.endGame = async (req, res) => {
    const { gameId } = req.body;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game) {
            return res.status(404).json({ message: 'Game not found' });
        }
        game.status = 'completed';
        game.endedAt = new Date();
        await game.save();
        res.status(200).json({ message: 'Game ended successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error ending game', error: error.message });
    }
};

exports.submitPunchline = async (req, res) => {
    const { gameId, username, punchlineText } = req.body;
    try {
        const game = await GameSession.findOne({ gameId });
        if (!game || game.status !== 'in-progress') {
            return res.status(400).json({ message: 'Invalid game or game not in progress' });
        }

        const currentRound = game.rounds[game.currentRound - 1];
        if (!currentRound) {
            return res.status(400).json({ message: 'No active round' });
        }

        // Check if user has already submitted a punchline for this round
        const existingPunchline = await Punchline.findOne({
            gameSession: game._id,
            author: username,
            newsPrompt: currentRound.newsPrompt
        });

        if (existingPunchline) {
            return res.status(400).json({ message: 'You have already submitted a punchline for this round' });
        }

        // Create new punchline
        const newPunchline = new Punchline({
            text: punchlineText,
            author: username,
            newsPrompt: currentRound.newsPrompt,
            gameSession: game._id
        });

        await newPunchline.save();

        // Add punchline to current round
        currentRound.punchlines.push(newPunchline._id);
        await game.save();

        res.status(201).json({ message: 'Punchline submitted successfully' });
    } catch (error) {
        console.error('Error submitting punchline:', error);
        res.status(500).json({ message: 'Error submitting punchline', error: error.message });
    }
};