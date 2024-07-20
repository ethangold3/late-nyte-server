const GameSession = require('../models/GameSession');
const NewsArticle = require('../models/NewsArticle');
const Punchline = require('../models/Punchline');
const Vote = require('../models/Vote');
const { io } = require('../../server');

// Helper function to generate a unique game ID
const generateUniqueId = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

exports.createGame = async (io) => {
    const newGame = new GameSession({
        gameId: generateUniqueId(),
        status: 'waiting',
        totalRounds: 5 // You can make this configurable later
    });
    await newGame.save();
    return {gameId : newGame.gameId};

};

exports.joinGame = async (io, gameId, username) => {
    const game = await GameSession.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    const existingPlayer = game.players.find(player => player.username === username);
    if (existingPlayer) {
      throw new Error('Username already taken in this game');
    }

    game.players.push({ username, score: 0 });
    await game.save();
    io.to(gameId).emit('gameUpdate', game);
    console.log(`Emitted gameUpdate for game ${gameId}`);
    return {message: 'Joined game successfully'};
};

exports.startGame = async (io, gameId) => {
    const game = await GameSession.findOne({ gameId });
    if (!game) throw new Error('Game not found');
    if (game.players.length < 3) {
        throw new Error('Not enough Players');
    }
    game.status = 'in-progress';
    game.currentRound = 1;
    await game.save();
    io.to(gameId).emit('gameUpdate', game);
    const result = await startNewRound(io, game);
    return result;
};

const startNewRound = async (io, game) => {
    const playerCount = game.players.length;
    const promptCount = playerCount; // We need as many prompts as there are players

    const prompts = await NewsArticle.find({ usedInGame: false }).limit(promptCount);
    if (prompts.length < promptCount) {
        throw new Error('Not enough unused prompts available');
    }

    const shuffledPromptIds = prompts.map(prompt => prompt._id).sort(() => Math.random() - 0.5);
    const shuffledPlayerUsernames = game.players.map(player => player.username).sort(() => Math.random() - 0.5);


        
    // Create assignments in the correct format
    const assignments = shuffledPlayerUsernames.map((username, index) => {
        const firstPromptIndex = index;
        const secondPromptIndex = (index + 1) % promptCount;
        return {
        player: username,
        prompts: [
            shuffledPromptIds[firstPromptIndex],
            shuffledPromptIds[secondPromptIndex]
        ]
        };
    });

    
      game.rounds.push({
        roundNumber: game.currentRound,
        newsPrompts: shuffledPromptIds,
        assignments,
        punchlines: [],
        votes: []
      });


    // Mark prompts as used
    await NewsArticle.updateMany(
        { _id: { $in: shuffledPromptIds } },
        { $set: { usedInGame: true } }
    );

    await game.save();
    io.to(game.gameId).emit('gameUpdate', game);
    return game;
};

exports.nextRound = async (io, gameId) => {
    const game = await GameSession.findOne({ gameId });
    if (!game || game.status !== 'in-progress') {
        throw new Error('Game not in progress');
    }
    if (game.currentRound >= game.totalRounds) {
        game.status = 'completed';
        game.endedAt = new Date();
    } else {
        game.currentRound += 1;
        await startNewRound(game);
    }

        await game.save();
        io.to(gameId).emit('gameUpdate', game);
        return { message: game.status === 'completed' ? 'Game completed' : 'Next round started' };
};


exports.submitVote = async (io, gameId, username, punchlineId) => {
    const game = await GameSession.findOne({ gameId }).populate('rounds.newsPrompts');
    if (!game) {
        throw new Error('Game not found');
    }

    // 2. Get the current round
    const currentRound = game.rounds[game.currentRound-1];
    if (!currentRound) {
        throw new Error('No active round found');
    }
    const punchline = await Punchline.findOne({
        gameSession: game._id,
        punchlineId: punchlineId,
        round: game.currentRound
      });
    if (!punchline) {
        throw new Error('Punchline not found in this game and round');
    }

    // 4. Check if the punchline belongs to the current round
    if (!currentRound.punchlines.includes(punchline._id)) {
        throw new Error('Invalid punchline for this round');
    }

    // 5. Find the news prompt associated with this punchline
    const newsPrompt = currentRound.newsPrompts.find(prompt => 
        punchline.newsPrompt.equals(prompt._id)
    );
    if (!newsPrompt) {
        throw new Error('Associated news prompt not found');
    }
    try {
        // 6. Check if the user has already voted for this news prompt in this game
        const existingVote = await Vote.findOne({
          voter: username,
          newsPrompt: newsPrompt._id,
          gameSession: game._id,
          round: game.currentRound
        });
    
        if (existingVote) {
          throw new Error('You have already voted for this news prompt in this round');
        }
    
        // 7. Create and save the new vote
        const newVote = new Vote({
          voter: username,
          newsPrompt: newsPrompt._id,
          selectedPunchline: punchline._id,
          gameSession: game._id,
          round: game.currentRound
        });
        await newVote.save();
        // 8. Update the game session
        currentRound.votes.push(newVote._id);
        await game.save();
        io.to(gameId).emit('gameUpdate', game);
    
        return { message: 'Vote submitted successfully' };
      } catch (error) {
        if (error.code === 11000) {
          throw new Error('You have already voted for this news prompt in this round');
        }
        throw error;
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
        io.to(gameId).emit('gameUpdate', game);
        res.status(200).json({ message: 'Game ended successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error ending game', error: error.message });
    }
};
exports.submitPunchline = async (io, gameId, username, newsArticleId, punchlineText) => {
    // 1. Find the game session
    const game = await GameSession.findOne({ gameId });
    if (!game) {
      throw new Error('Game not found');
    }
  
    // 2. Verify the news article exists and is part of the current round
    const currentRound = game.rounds[game.currentRound - 1];
    if (!currentRound) {
      throw new Error('No active round found');
    }
    
    if (!currentRound.newsPrompts.includes(newsArticleId)) {
      throw new Error('News article not found in the current round');
    }
    try {
        // 5. Create and save the new punchline
        const newPunchline = new Punchline({
            text: punchlineText,
            author: username,
            newsPrompt: newsArticleId,
            gameSession: game._id,
            round: game.currentRound
        });

        await newPunchline.save();
        // 6. Update the game session
        currentRound.punchlines.push(newPunchline._id);
        await game.save();
        io.to(gameId).emit('gameUpdate', game);
        return { 
        message: 'Punchline submitted successfully',
        punchlineId: newPunchline.punchlineId
        };
  } catch (error) {
    if (error.code === 11000) {
      // This could be due to either duplicate submission or exceeding the punchline limit
      throw new Error('You have already submitted a punchline for this news article or the maximum number of punchlines has been reached');
    }
    throw error;
  }
};